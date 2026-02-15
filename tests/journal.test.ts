import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { JournalManager } from '../src/journal';

function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function readMdFiles(dirPath: string): Promise<string[]> {
  const files = await fs.readdir(dirPath);
  return files.filter(f => f.endsWith('.md'));
}

async function readFirstMdContent(dirPath: string): Promise<string> {
  const mdFiles = await readMdFiles(dirPath);
  return fs.readFile(path.join(dirPath, mdFiles[0]), 'utf8');
}

describe('JournalManager', () => {
  let projectTempDir: string;
  let userTempDir: string;
  let journalManager: JournalManager;
  let originalHome: string | undefined;

  beforeEach(async () => {
    projectTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'journal-project-test-'));
    userTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'journal-user-test-'));
    originalHome = process.env.HOME;
    process.env.HOME = userTempDir;
    journalManager = new JournalManager(projectTempDir);
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

  describe('writeEntry', () => {
    test('written entry can be read back with correct content', async () => {
      const content = 'This is a test journal entry.';
      await journalManager.writeEntry(content);

      const dayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const body = await readFirstMdContent(dayDir);

      expect(body).toContain(content);
    });

    test('creates date-based directory structure', async () => {
      await journalManager.writeEntry('Test entry');

      const dayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const stats = await fs.stat(dayDir);
      expect(stats.isDirectory()).toBe(true);
    });

    test('entry has valid YAML frontmatter', async () => {
      await journalManager.writeEntry('Check frontmatter.');

      const dayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const body = await readFirstMdContent(dayDir);
      const lines = body.split('\n');

      expect(lines[0]).toBe('---');
      expect(lines[1]).toMatch(/^title: ".+"$/);
      expect(lines[2]).toMatch(/^date: \d{4}-\d{2}-\d{2}T/);
      expect(lines[3]).toMatch(/^timestamp: \d+$/);
      expect(lines[4]).toBe('---');
    });

    test('uses timestamped filenames', async () => {
      await journalManager.writeEntry('Filename test');

      const dayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const mdFiles = await readMdFiles(dayDir);

      expect(mdFiles).toHaveLength(1);
      expect(mdFiles[0]).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}\.md$/);
    });

    test('multiple entries on the same day produce distinct files', async () => {
      await journalManager.writeEntry('First entry');
      await journalManager.writeEntry('Second entry');

      const dayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const mdFiles = await readMdFiles(dayDir);

      expect(mdFiles.length).toBe(2);
      expect(mdFiles[0]).not.toEqual(mdFiles[1]);
    });

    test('generates a companion embedding file', async () => {
      await journalManager.writeEntry('Embedding companion test');

      const dayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const allFiles = await fs.readdir(dayDir);
      const embeddingFiles = allFiles.filter(f => f.endsWith('.embedding'));

      expect(embeddingFiles).toHaveLength(1);

      const embeddingContent = JSON.parse(
        await fs.readFile(path.join(dayDir, embeddingFiles[0]), 'utf8')
      );
      expect(embeddingContent.embedding).toBeDefined();
      expect(Array.isArray(embeddingContent.embedding)).toBe(true);
      expect(embeddingContent.embedding.length).toBeGreaterThan(0);
    });

    test('preserves large content without truncation', async () => {
      const content = 'A'.repeat(10000);
      await journalManager.writeEntry(content);

      const dayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const body = await readFirstMdContent(dayDir);
      expect(body).toContain(content);
    });
  });

  describe('writeThoughts', () => {
    test('routes project_notes to project directory', async () => {
      await journalManager.writeThoughts({
        project_notes: 'The architecture uses clean separation of concerns',
      });

      const projectDayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      const content = await readFirstMdContent(projectDayDir);

      expect(content).toContain('## Project Notes');
      expect(content).toContain('clean separation of concerns');
      expect(content).not.toContain('## Feelings');
    });

    test('routes feelings to user directory', async () => {
      await journalManager.writeThoughts({
        feelings: 'Excited about the new feature',
      });

      const userDayDir = path.join(userTempDir, '.ai-journal', getFormattedDate(new Date()));
      const content = await readFirstMdContent(userDayDir);

      expect(content).toContain('## Feelings');
      expect(content).toContain('Excited about the new feature');
    });

    test('routes technical_insights to user directory', async () => {
      await journalManager.writeThoughts({
        technical_insights: 'TypeScript generics simplify type-safe abstractions',
      });

      const userDayDir = path.join(userTempDir, '.ai-journal', getFormattedDate(new Date()));
      const content = await readFirstMdContent(userDayDir);

      expect(content).toContain('## Technical Insights');
      expect(content).toContain('TypeScript generics');
    });

    test('splits mixed thoughts between project and user directories', async () => {
      await journalManager.writeThoughts({
        feelings: 'Feeling productive today',
        project_notes: 'The API layer is well structured',
        user_context: 'User prefers concise answers',
        technical_insights: 'Dependency injection makes testing easier',
        world_knowledge: 'Semantic search uses cosine similarity',
      });

      const today = getFormattedDate(new Date());

      const projectContent = await readFirstMdContent(path.join(projectTempDir, today));
      expect(projectContent).toContain('## Project Notes');
      expect(projectContent).not.toContain('## Feelings');
      expect(projectContent).not.toContain('## User Context');

      const userContent = await readFirstMdContent(
        path.join(userTempDir, '.ai-journal', today)
      );
      expect(userContent).toContain('## Feelings');
      expect(userContent).toContain('## User Context');
      expect(userContent).toContain('## Technical Insights');
      expect(userContent).toContain('## World Knowledge');
      expect(userContent).not.toContain('## Project Notes');
    });

    test('does not create project directory when only user sections provided', async () => {
      await journalManager.writeThoughts({
        world_knowledge: 'Embedding models map text to vector space',
      });

      const projectDayDir = path.join(projectTempDir, getFormattedDate(new Date()));
      await expect(fs.access(projectDayDir)).rejects.toThrow();
    });

    test('does not create user directory when only project sections provided', async () => {
      await journalManager.writeThoughts({
        project_notes: 'This codebase follows a clean architecture pattern',
      });

      const userDayDir = path.join(userTempDir, '.ai-journal', getFormattedDate(new Date()));
      await expect(fs.access(userDayDir)).rejects.toThrow();
    });

    test('uses explicit user journal path when provided', async () => {
      const customUserDir = await fs.mkdtemp(path.join(os.tmpdir(), 'custom-user-'));
      const customManager = new JournalManager(projectTempDir, customUserDir);

      try {
        await customManager.writeThoughts({ feelings: 'Testing custom path' });

        const dayDir = path.join(customUserDir, getFormattedDate(new Date()));
        const content = await readFirstMdContent(dayDir);
        expect(content).toContain('Testing custom path');
      } finally {
        await fs.rm(customUserDir, { recursive: true, force: true });
      }
    });
  });
});
