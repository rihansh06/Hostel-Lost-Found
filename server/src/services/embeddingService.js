let pipelineInstance = null;
let loadingPromise = null;

// Lazy-load the HuggingFace transformers pipeline on first use or at startup
const getPipeline = async () => {
  if (pipelineInstance) {
    return pipelineInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      console.log('Loading Xenova/all-MiniLM-L6-v2 model for text embeddings...');
      pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true,
      });
      console.log('Xenova/all-MiniLM-L6-v2 text embedding model loaded successfully.');
      return pipelineInstance;
    } catch (err) {
      console.error('Failed to initialize text embedding pipeline:', err.message);
      pipelineInstance = null;
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
};

// Generates a normalized 384-dimensional dense embedding vector for the provided text
const getTextEmbedding = async (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text must be a non-empty string');
  }

  const extractor = await getPipeline();
  // Mean-pooling and normalization gives unit-length embeddings
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data);
};

// Standardizes post input format: "title. category. description"
const formatPostText = (post) => {
  const title = (post.title || '').trim();
  const category = (post.category || '').trim();
  const description = (post.description || '').trim();
  return `${title}. ${category}. ${description}`;
};

// Compute embedding for a post using the standardized input string
const getPostTextEmbedding = async (post) => {
  const formattedText = formatPostText(post);
  return getTextEmbedding(formattedText);
};

module.exports = {
  getTextEmbedding,
  getPostTextEmbedding,
  formatPostText,
  getPipeline,
};
