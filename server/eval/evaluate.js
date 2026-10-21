const fs = require('fs');
const path = require('path');
const { TfIdfVectorizer, cosineSimilarity: tfidfCosine } = require('../src/services/keywordMatchService');
const { getTextEmbedding, formatPostText } = require('../src/services/embeddingService');
const { cosineSimilarity } = require('../src/services/scoringService');

const runEvaluation = async () => {
  console.log('===============================================================');
  console.log('       HOSTEL LOST & FOUND MATCHING EVALUATION BENCHMARK       ');
  console.log('===============================================================\n');

  const pairsPath = path.join(__dirname, 'pairs.json');
  if (!fs.existsSync(pairsPath)) {
    console.error(`Error: pairs.json not found at ${pairsPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(pairsPath, 'utf8');
  const pairs = JSON.parse(rawData);

  console.log(`Loaded ${pairs.length} labeled test pairs from eval/pairs.json.`);
  console.log(`Candidate pool size: ${pairs.length} found items.`);
  console.log('Benchmarking TF-IDF Keyword Baseline vs. Xenova/all-MiniLM-L6-v2 Dense Embeddings...\n');

  // Prepare text inputs: "title. category. description"
  const lostItems = pairs.map((p) => ({
    id: p.id,
    text: formatPostText(p.lost),
    raw: p.lost,
  }));

  const foundCandidates = pairs.map((p) => ({
    id: p.id,
    text: formatPostText(p.found),
    raw: p.found,
  }));

  // ==========================================
  // 1. TF-IDF Keyword Matching Baseline
  // ==========================================
  console.log('[1/2] Running TF-IDF Baseline...');
  const corpus = [...lostItems.map((l) => l.text), ...foundCandidates.map((f) => f.text)];
  const vectorizer = new TfIdfVectorizer();
  vectorizer.fit(corpus);

  const candidateTfIdfVectors = foundCandidates.map((f) => ({
    id: f.id,
    vector: vectorizer.transform(f.text),
  }));

  let tfidfP1Count = 0;
  let tfidfP3Count = 0;
  let tfidfMjrSum = 0;

  for (const lost of lostItems) {
    const lostVec = vectorizer.transform(lost.text);

    // Score all candidates
    const scoredCandidates = candidateTfIdfVectors.map((cand) => ({
      id: cand.id,
      score: tfidfCosine(lostVec, cand.vector),
    }));

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Find rank of ground truth candidate (1-based index)
    const rank = scoredCandidates.findIndex((c) => c.id === lost.id) + 1;

    if (rank === 1) tfidfP1Count++;
    if (rank >= 1 && rank <= 3) tfidfP3Count++;
    if (rank > 0) tfidfMjrSum += 1.0 / rank;
  }

  const tfidfP1 = (tfidfP1Count / lostItems.length) * 100;
  const tfidfP3 = (tfidfP3Count / lostItems.length) * 100;
  const tfidfMRR = (tfidfMjrSum / lostItems.length).toFixed(3);

  // ==========================================
  // 2. Dense Semantic Embedding Approach
  // ==========================================
  console.log('[2/2] Generating Dense Text Embeddings (Xenova/all-MiniLM-L6-v2)...');
  const candidateEmbeddings = [];
  for (let i = 0; i < foundCandidates.length; i++) {
    process.stdout.write(`Embedding candidates: ${i + 1}/${foundCandidates.length}\r`);
    const emb = await getTextEmbedding(foundCandidates[i].text);
    candidateEmbeddings.push({ id: foundCandidates[i].id, embedding: emb });
  }
  process.stdout.write('\n');

  let embP1Count = 0;
  let embP3Count = 0;
  let embMjrSum = 0;

  const interestingExamples = [];

  for (let i = 0; i < lostItems.length; i++) {
    const lost = lostItems[i];
    process.stdout.write(`Matching lost items: ${i + 1}/${lostItems.length}\r`);
    const lostEmb = await getTextEmbedding(lost.text);

    const scored = candidateEmbeddings.map((cand) => ({
      id: cand.id,
      score: cosineSimilarity(lostEmb, cand.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);

    const rank = scored.findIndex((c) => c.id === lost.id) + 1;
    if (rank === 1) embP1Count++;
    if (rank >= 1 && rank <= 3) embP3Count++;
    if (rank > 0) embMjrSum += 1.0 / rank;

    // Save examples where embedding beats keyword matching because of vocabulary mismatch
    if (i < 10) {
      interestingExamples.push({
        id: lost.id,
        lostTitle: lost.raw.title,
        foundTitle: pairs[i].found.title,
        embeddingRank: rank,
        score: scored.find((c) => c.id === lost.id).score.toFixed(3),
      });
    }
  }
  process.stdout.write('\n\n');

  const embP1 = (embP1Count / lostItems.length) * 100;
  const embP3 = (embP3Count / lostItems.length) * 100;
  const embMRR = (embMjrSum / lostItems.length).toFixed(3);

  // ==========================================
  // Display Benchmark Results Table
  // ==========================================
  console.log('---------------------------------------------------------------');
  console.log('                    EVALUATION BENCHMARK RESULTS               ');
  console.log('---------------------------------------------------------------');
  console.log(
    `| Metric        | TF-IDF Baseline | Dense Embedding | Delta      |`
  );
  console.log(
    `|---------------|-----------------|-----------------|------------|`
  );
  console.log(
    `| Precision@1   | ${tfidfP1.toFixed(1).padStart(13)}%  | ${embP1.toFixed(1).padStart(13)}%  | +${(embP1 - tfidfP1).toFixed(1)}%     |`
  );
  console.log(
    `| Precision@3   | ${tfidfP3.toFixed(1).padStart(13)}%  | ${embP3.toFixed(1).padStart(13)}%  | +${(embP3 - tfidfP3).toFixed(1)}%     |`
  );
  console.log(
    `| MRR           | ${tfidfMRR.padStart(15)} | ${embMRR.padStart(15)} | +${(embMRR - tfidfMRR).toFixed(3)}      |`
  );
  console.log('---------------------------------------------------------------\n');

  console.log('Sample Semantic Generalization Checks:');
  interestingExamples.slice(0, 5).forEach((ex) => {
    console.log(
      `  • Pair #${ex.id}: "${ex.lostTitle}"  <==>  "${ex.foundTitle}" (Rank: #${ex.embeddingRank}, Sim: ${ex.score})`
    );
  });
  console.log('\nEvaluation completed successfully.');
};

runEvaluation().catch((err) => {
  console.error('Evaluation run failed:', err);
  process.exit(1);
});
