const path = require('path');
const fs = require('fs');

let clipPipelineInstance = null;
let clipLoadingPromise = null;

// In-memory cache for computed image embeddings: key (image path or filename) -> embedding array
const imageEmbeddingCache = new Map();

// Dynamic import helper that works cleanly across both standard Node runtime and Jest VM
const importTransformers = async () => {
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    return await dynamicImport('@huggingface/transformers');
  } catch (err) {
    return await import('@huggingface/transformers');
  }
};

/**
 * Lazy-loads the HuggingFace transformers CLIP vision model on first use
 */
const getClipPipeline = async () => {
  if (clipPipelineInstance) {
    return clipPipelineInstance;
  }

  if (clipLoadingPromise) {
    return clipLoadingPromise;
  }

  clipLoadingPromise = (async () => {
    try {
      const { pipeline } = await importTransformers();
      console.log('Loading Xenova/clip-vit-base-patch32 model for visual feature embeddings...');
      clipPipelineInstance = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32', {
        quantized: true,
      });
      console.log('Xenova/clip-vit-base-patch32 vision model loaded successfully.');
      return clipPipelineInstance;
    } catch (err) {
      console.warn('[ImageEmbeddingService] Failed to load CLIP vision model:', err.message);
      clipPipelineInstance = null;
      clipLoadingPromise = null;
      throw err;
    }
  })();

  return clipLoadingPromise;
};

/**
 * Resolves local image URL/path to absolute file path on disk
 */
const resolveLocalImagePath = (imgRef) => {
  if (!imgRef || typeof imgRef !== 'string') return null;

  // If it's already an absolute path that exists
  if (path.isAbsolute(imgRef) && fs.existsSync(imgRef)) {
    return imgRef;
  }

  // If it starts with /uploads/ or uploads/
  const cleanRef = imgRef.replace(/^\/?uploads\//, '');
  const candidatePath = path.join(__dirname, '../../uploads', cleanRef);

  if (fs.existsSync(candidatePath)) {
    return candidatePath;
  }

  return null;
};

/**
 * Computes a normalized dense vector embedding for an image using CLIP ViT-B-32
 * Caches results in-memory.
 */
const getImageEmbedding = async (imageRef) => {
  if (!imageRef) return null;

  // Check in-memory cache first
  const cacheKey = typeof imageRef === 'string' ? imageRef.trim() : null;
  if (cacheKey && imageEmbeddingCache.has(cacheKey)) {
    return imageEmbeddingCache.get(cacheKey);
  }

  const localFilePath = resolveLocalImagePath(imageRef);
  if (!localFilePath) {
    console.warn(`[ImageEmbeddingService] Image file not found on disk: ${imageRef}`);
    return null;
  }

  try {
    const { RawImage } = await importTransformers();
    const extractor = await getClipPipeline();

    // Read image using Transformers.js RawImage
    const image = await RawImage.read(localFilePath);

    // Compute visual feature embedding with mean pooling and normalization
    const output = await extractor(image, {
      pooling: 'mean',
      normalize: true,
    });

    const embedding = Array.from(output.data);

    // Store in cache
    if (cacheKey) {
      imageEmbeddingCache.set(cacheKey, embedding);
    }

    return embedding;
  } catch (err) {
    console.warn(`[ImageEmbeddingService] Could not generate embedding for image ${imageRef}:`, err.message);
    return null;
  }
};

/**
 * Clears in-memory image embedding cache (useful for testing)
 */
const clearImageCache = () => {
  imageEmbeddingCache.clear();
};

module.exports = {
  getImageEmbedding,
  resolveLocalImagePath,
  clearImageCache,
  getClipPipeline,
};
