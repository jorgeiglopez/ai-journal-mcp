import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { EmbeddingService } from '../src/embeddings';
import { SearchService } from '../src/search';
import { JournalManager } from '../src/journal';

describe('EmbeddingService', () => {
  test('generates a non-empty numeric array', async () => {
    const service = EmbeddingService.getInstance();
    const embedding = await service.generateEmbedding('Test input text');

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBeGreaterThan(0);
    expect(typeof embedding[0]).toBe('number');
  });

  test('extracts text and sections from markdown with frontmatter', () => {
    const service = EmbeddingService.getInstance();

    const markdown = `---
title: "Test Entry"
date: 2026-02-15T12:00:00.000Z
timestamp: 1771156800000
---

## Feelings

I feel great about this feature implementation.

## Technical Insights

TypeScript interfaces are really powerful for maintaining code quality.`;

    const { text, sections } = service.extractSearchableText(markdown);

    expect(text).toContain('I feel great about this feature implementation');
    expect(text).toContain('TypeScript interfaces are really powerful');
    expect(text).not.toContain('title: "Test Entry"');
    expect(sections).toEqual(['Feelings', 'Technical Insights']);
  });

  test('strips frontmatter but preserves all body content', () => {
    const service = EmbeddingService.getInstance();

    const markdown = `---
title: "Entry"
date: 2026-01-01T00:00:00.000Z
timestamp: 1000000000000
---

Just a plain paragraph with no sections.`;

    const { text, sections } = service.extractSearchableText(markdown);

    expect(text).toContain('Just a plain paragraph with no sections.');
    expect(sections).toHaveLength(0);
  });

  describe('cosineSimilarity', () => {
    const service = EmbeddingService.getInstance();

    test('identical vectors return 1.0', () => {
      expect(service.cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0, 5);
    });

    test('orthogonal vectors return 0.0', () => {
      expect(service.cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0, 5);
    });

    test('opposite vectors return -1.0', () => {
      expect(service.cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0, 5);
    });

    test('zero vector returns 0.0', () => {
      expect(service.cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    });

    test('throws on mismatched lengths', () => {
      expect(() => service.cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });

  describe('save and load embedding', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'embed-test-'));
    });

    afterEach(async () => {
      await fs.rm(tmpDir, { recursive: true, force: true });
    });

    test('round-trips embedding data through save and load', async () => {
      const service = EmbeddingService.getInstance();
      const filePath = path.join(tmpDir, 'entry.md');
      await fs.writeFile(filePath, 'placeholder', 'utf8');

      const original = {
        embedding: [0.1, 0.2, 0.3],
        text: 'some text',
        sections: ['Feelings'],
        timestamp: Date.now(),
        path: filePath,
      };

      await service.saveEmbedding(filePath, original);
      const loaded = await service.loadEmbedding(filePath);

      expect(loaded).not.toBeNull();
      expect(loaded!.embedding).toEqual(original.embedding);
      expect(loaded!.text).toBe(original.text);
      expect(loaded!.sections).toEqual(original.sections);
    });

    test('returns null for non-existent embedding', async () => {
      const service = EmbeddingService.getInstance();
      const result = await service.loadEmbedding(path.join(tmpDir, 'nope.md'));
      expect(result).toBeNull();
    });
  });
});

describe('SearchService', () => {
  let projectTempDir: string;
  let userTempDir: string;
  let journalManager: JournalManager;
  let searchService: SearchService;
  let originalHome: string | undefined;

  beforeEach(async () => {
    projectTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'search-project-test-'));
    userTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'search-user-test-'));
    originalHome = process.env.HOME;
    process.env.HOME = userTempDir;
    journalManager = new JournalManager(projectTempDir);
    searchService = new SearchService(projectTempDir, path.join(userTempDir, '.ai-journal'));
  });

  afterEach(async () => {
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    } else {
      delete process.env.HOME;
    }
    await fs.rm(projectTempDir, { recursive: true, force: true });
    await fs.rm(userTempDir, { recursive: true, force: true });
  });

  test('finds entries that were written', async () => {
    await journalManager.writeThoughts({
      feelings: 'I feel frustrated with debugging TypeScript errors',
    });

    const results = await searchService.search('TypeScript debugging');

    expect(results.length).toBeGreaterThan(0);

    const matchingResult = results.find(r => r.text.includes('frustrated'));
    expect(matchingResult).toBeDefined();
    expect(matchingResult!.score).toBeGreaterThan(0.1);
  });

  test('returns results with expected shape', async () => {
    await journalManager.writeThoughts({
      technical_insights: 'Async patterns in JavaScript require careful error handling',
    });

    const results = await searchService.search('error handling');

    expect(results.length).toBeGreaterThan(0);

    const result = results[0];
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('sections');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('excerpt');
    expect(result).toHaveProperty('type');
  });

  test('filters by entry type', async () => {
    await journalManager.writeThoughts({
      project_notes: 'The React component tree is deeply nested',
    });
    await journalManager.writeThoughts({
      feelings: 'I enjoy working on frontend architecture',
    });

    const projectResults = await searchService.search('React', { type: 'project' });
    const userResults = await searchService.search('frontend', { type: 'user' });

    expect(projectResults.length).toBeGreaterThan(0);
    projectResults.forEach(r => expect(r.type).toBe('project'));

    if (userResults.length > 0) {
      userResults.forEach(r => expect(r.type).toBe('user'));
    }
  });

  test('filters by section', async () => {
    await journalManager.writeThoughts({
      feelings: 'Feeling optimistic about shipping this',
      technical_insights: 'Mocking external services speeds up tests',
    });

    const results = await searchService.search('testing', {
      sections: ['Technical Insights'],
    });

    if (results.length > 0) {
      results.forEach(r =>
        expect(r.sections.some(s => s.toLowerCase().includes('technical'))).toBe(true)
      );
    }
  });

  test('respects limit option', async () => {
    await journalManager.writeThoughts({ feelings: 'Entry one' });
    await journalManager.writeThoughts({ feelings: 'Entry two' });
    await journalManager.writeThoughts({ feelings: 'Entry three' });

    const results = await searchService.search('entry', { limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  test('returns empty array when no entries exist', async () => {
    const results = await searchService.search('anything');
    expect(results).toEqual([]);
  });

  test('readEntry returns content for valid path', async () => {
    await journalManager.writeThoughts({
      project_notes: 'Important architecture decision documented here',
    });

    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayDir = path.join(projectTempDir, dateString);
    const files = await fs.readdir(dayDir);
    const mdFile = files.find(f => f.endsWith('.md'));

    const content = await searchService.readEntry(path.join(dayDir, mdFile!));
    expect(content).toContain('Important architecture decision');
  });

  test('readEntry rejects paths outside journal directories', async () => {
    await expect(searchService.readEntry('/etc/passwd')).rejects.toThrow('Access denied');
  });

  test('listRecent returns entries sorted by timestamp descending', async () => {
    await journalManager.writeThoughts({ feelings: 'Earlier thought' });
    await journalManager.writeThoughts({ feelings: 'Later thought' });

    const results = await searchService.listRecent({ type: 'user' });

    expect(results.length).toBe(2);
    expect(results[0].timestamp).toBeGreaterThanOrEqual(results[1].timestamp);
  });
});
