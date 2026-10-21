// TF-IDF baseline implementation for text matching evaluation comparison

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

// Tokenizes text into normalized lower-case tokens, ignoring punctuation and stop words
const tokenize = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
};

class TfIdfVectorizer {
  constructor() {
    this.vocabulary = new Map(); // word -> index
    this.idf = [];
    this.docCount = 0;
  }

  fit(documents) {
    this.docCount = documents.length;
    const docTermFreqs = [];
    const docFreq = new Map();

    // 1. Build vocabulary & document frequencies
    documents.forEach((doc) => {
      const tokens = tokenize(doc);
      const uniqueTokensInDoc = new Set(tokens);

      uniqueTokensInDoc.forEach((term) => {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
        if (!this.vocabulary.has(term)) {
          this.vocabulary.set(term, this.vocabulary.size);
        }
      });
    });

    // 2. Compute smooth IDF: log((N + 1) / (DF + 1)) + 1
    const vocabSize = this.vocabulary.size;
    this.idf = new Array(vocabSize).fill(0);

    for (const [term, idx] of this.vocabulary.entries()) {
      const df = docFreq.get(term) || 0;
      this.idf[idx] = Math.log((this.docCount + 1) / (df + 1)) + 1.0;
    }

    return this;
  }

  transform(text) {
    const tokens = tokenize(text);
    const vocabSize = this.vocabulary.size;
    const vector = new Array(vocabSize).fill(0);

    if (tokens.length === 0 || vocabSize === 0) {
      return vector;
    }

    // Term counts
    const termCounts = new Map();
    tokens.forEach((t) => {
      if (this.vocabulary.has(t)) {
        termCounts.set(t, (termCounts.get(t) || 0) + 1);
      }
    });

    // TF * IDF
    let normSq = 0;
    for (const [term, count] of termCounts.entries()) {
      const idx = this.vocabulary.get(term);
      const tf = count / tokens.length;
      const tfidf = tf * this.idf[idx];
      vector[idx] = tfidf;
      normSq += tfidf * tfidf;
    }

    // L2 Normalize
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < vocabSize; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }
}

// Cosine similarity between two normalized or unnormalized numeric arrays
const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Computes pairwise similarity between two texts using a corpus-fitted TF-IDF model
const computeKeywordSimilarity = (textA, textB, corpus = []) => {
  const fullCorpus = corpus.length > 0 ? corpus : [textA, textB];
  const vectorizer = new TfIdfVectorizer();
  vectorizer.fit(fullCorpus);

  const vecA = vectorizer.transform(textA);
  const vecB = vectorizer.transform(textB);

  return cosineSimilarity(vecA, vecB);
};

module.exports = {
  tokenize,
  TfIdfVectorizer,
  cosineSimilarity,
  computeKeywordSimilarity,
};
