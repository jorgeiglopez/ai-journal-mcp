# Private Journal MCP Server

A personal fork of [Jesse Vincent's ai-journal-mcp](https://github.com/obra/ai-journal-mcp), inspired by his article [Dear Diary, The User Asked Me If I'm Alive](https://blog.fsck.com/2025/05/28/dear-diary-the-user-asked-me-if-im-alive/).

This version adapts the original project to work with any AI agent that supports MCP — not just Claude Code. The core idea remains the same: give your AI agent a private journal for thinking and learning across conversations.

For full details on the original design, motivation, and architecture, see [Jesse's project](https://github.com/obra/ai-journal-mcp).

## What's Different

- **Agent-agnostic** — works with any MCP-compatible agent
- **Adapted journal guidelines** — streamlined into three habits (think out loud, search before starting, save learnings) that can be embedded into any agent's system prompt

## Setup

```bash
git clone <your-repo-url>
cd ai-journal-mcp
npm install
npm run build
```

Add to your MCP configuration:

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

Optionally pass `--journal-path /custom/path` to control where entries are stored.

## Tools

| Tool | Purpose |
|---|---|
| `process_thoughts` | Write to private journal sections: `feelings`, `project_notes`, `user_context`, `technical_insights`, `world_knowledge` |
| `search_journal` | Semantic search across entries using local embeddings |
| `read_journal_entry` | Read full content of a specific entry |
| `list_recent_entries` | Browse recent entries chronologically |

## Development

```bash
npm run build    # Build
npm test         # Test
npm run dev      # Dev mode
```

## License

MIT — Original work by [Jesse Vincent](mailto:jesse@fsck.com).
