jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(
    jest.fn().mockImplementation((text: string) => {
      const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      const dim = 384;
      const embedding = new Float32Array(dim);

      for (const word of words) {
        let wordHash = 0;
        for (let i = 0; i < word.length; i++) {
          wordHash = ((wordHash << 5) - wordHash + word.charCodeAt(i)) | 0;
        }
        const idx = ((wordHash % dim) + dim) % dim;
        embedding[idx] += 1;
        embedding[(idx + 1) % dim] += 0.5;
        embedding[(idx + 2) % dim] += 0.25;
      }

      const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
      if (norm > 0) {
        for (let i = 0; i < dim; i++) embedding[i] /= norm;
      }

      return Promise.resolve({ data: embedding });
    })
  ),
}));
