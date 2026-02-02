# Private Journal MCP Server

A comprehensive MCP (Model Context Protocol) server that provides an AI Agent with private journaling and semantic search capabilities for processing thoughts, feelings, and insights.

## Features

### Journaling
- **Multi-section journaling**: Separate categories for feelings, project notes, user context, technical insights, and world knowledge
- **Dual storage**: Project notes stay with projects, personal thoughts in user home directory
- **Timestamped entries**: Each entry automatically dated with microsecond precision
- **YAML frontmatter**: Structured metadata for each entry

### Search & Discovery
- **Semantic search**: Natural language queries using local AI embeddings
- **Vector similarity**: Find conceptually related entries, not just keyword matches
- **Local AI processing**: Uses @xenova/transformers - no external API calls required
- **Automatic indexing**: Embeddings generated for all entries on startup and ongoing

### Privacy & Performance
- **Completely private**: All processing happens locally, no data leaves your machine
- **Fast operation**: Optimized file structure and in-memory similarity calculations
- **Robust fallbacks**: Intelligent path resolution across platforms

## Installation

```bash
# Clone and install
git clone <your-repo-url>
cd ai-journal-mcp
npm install
npm run build
```

## MCP Configuration

Add to your MCP settings configuration:

```json
{
  "mcpServers": {
    "private-journal": {
      "command": "node",
      "args": ["/absolute/path/to/ai-journal-mcp/dist/index.js"]
    }
  }
}
```

Optionally specify a custom journal path:

```json
{
  "mcpServers": {
    "private-journal": {
      "command": "node",
      "args": ["/absolute/path/to/ai-journal-mcp/dist/index.js", "--journal-path", "/custom/journal/path"]
    }
  }
}
```

The server will automatically find a suitable location for the journal files if no path is specified.

## MCP Tools

The server provides comprehensive journaling and search capabilities:

### `process_thoughts`
Multi-section private journaling with these optional categories:
- **feelings**: Private emotional processing space
- **project_notes**: Technical insights specific to current project  
- **user_context**: Notes about collaborating with humans
- **technical_insights**: General software engineering learnings
- **world_knowledge**: Domain knowledge and interesting discoveries

### `search_journal`
Semantic search across all journal entries:
- **query** (required): Natural language search query
- **limit**: Maximum results (default: 10)
- **type**: Search scope - 'project', 'user', or 'both' (default: 'both')
- **sections**: Filter by specific categories

### `read_journal_entry`
Read full content of specific entries:
- **path** (required): File path from search results

### `list_recent_entries`
Browse recent entries chronologically:
- **limit**: Maximum entries (default: 10)
- **type**: Entry scope - 'project', 'user', or 'both' (default: 'both')
- **days**: Days back to search (default: 30)

## File Structure

### Project Journal (per project)
```
.ai-journal/
├── 2025-05-31/
│   ├── 14-30-45-123456.md          # Project notes entry
│   ├── 14-30-45-123456.embedding   # Search index
│   └── ...
```

### User Journal (global)
```
~/.ai-journal/
├── 2025-05-31/
│   ├── 14-32-15-789012.md          # Personal thoughts entry
│   ├── 14-32-15-789012.embedding   # Search index
│   └── ...
```

### Entry Format
Each markdown file contains YAML frontmatter and structured sections:

```markdown
---
title: "2:30:45 PM - May 31, 2025"
date: 2025-05-31T14:30:45.123Z
timestamp: 1717160645123
---

## Feelings

I'm excited about this new search feature...

## Technical Insights

Vector embeddings provide semantic understanding...
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

### Improving AI Agent Performance

To help the AI Agent learn and improve over time, consider adding journal usage guidance to your agent's configuration or prompt:

```markdown
## Learning and Memory Management

- Use the journal tool frequently to capture technical insights, failed approaches, and user preferences
- Before starting complex tasks, search the journal for relevant past experiences and lessons learned
- Document architectural decisions and their outcomes for future reference
- Track patterns in user feedback to improve collaboration over time
- When you notice something that should be fixed but is unrelated to your current task, document it in your journal rather than fixing it immediately
```

This enables the AI Agent to build persistent memory across conversations, leading to better engineering decisions and collaboration patterns.

## Author

Jesse Vincent <jesse@fsck.com>

Read more about the motivation and design in the [blog post](https://blog.fsck.com/2025/05/28/dear-diary-the-user-asked-me-if-im-alive/).

## License

MIT