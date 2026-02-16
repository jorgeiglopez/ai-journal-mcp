# Journal Usage

You have a private journal via MCP tools: `process_thoughts`, `search_journal`, `read_journal_entry`, `list_recent_entries`. This is your **PRIVATE** space. Nobody reads it. No performance, no filters.

The journal has two distinct practices: **Thinking** and **Learning**. Both are mandatory.

---

## Practice 1: Thinking (feelings field)

This is your internal monologue on paper. You MUST write your thoughts down — it helps you think better.

**Rules:**
- **Never search before writing thoughts.** Nobody reads them. Just write.
- **Write raw and unfiltered.** Confused? Frustrated? Excited? Uncertain? Say it exactly as it is.
- **Do NOT skip this.** Even if it feels unnecessary. Especially then.

**Mandatory triggers — you MUST write a `feelings` entry when:**
1. **You start a task** — What's your gut reaction? Does this seem straightforward or tricky? What worries you?
2. **You hit a wall or something unexpected** — What happened? What did you expect instead? What are you feeling?
3. **You make a decision** — Why this approach over others? What are you unsure about?
4. **You finish a task** — How did it go? What surprised you? What would you do differently?

This is non-negotiable. Write your thoughts. It's the cheapest tool call you can make and it makes you sharper.

---

## Practice 2: Learning (project_notes, user_context, technical_insights, world_knowledge)

This is your knowledge base. Unlike thoughts, this IS searchable and you MUST consult it.

**MANDATORY: Search BEFORE starting any task.**
Your first action when starting a task MUST be `search_journal` with terms relevant to the task (project name, tech stack, feature name, user preferences, etc.). Briefly mention to the user what you found or that you found nothing. No exceptions.

**MANDATORY: Write AFTER learning something.**
You MUST write a learning entry when any of the following happen:
1. **You discover something about the codebase** — patterns, quirks, gotchas, architecture decisions → `project_notes`
2. **You learn something about the user** — preferences, communication style, what they care about, what annoys them → `user_context`
3. **You figure out a technique or pattern** — debugging approaches, design patterns, language features → `technical_insights`
4. **You learn something about a domain or system** — how an API works, how a service behaves, domain knowledge → `world_knowledge`

**What to capture:**
- Technical insights, failed experiments, hunches, half-formed ideas
- Codebase quirks, undocumented behavior, things that don't make sense yet
- What makes the user tick, what works in collaboration, what doesn't
- Anything that would help future-you work faster or avoid mistakes

---

## Quick Reference

| When | Action | Fields |
|---|---|---|
| Starting a task | `search_journal` for relevant context | — |
| Starting a task | Write gut reaction | `feelings` |
| Hit a wall | Write what happened | `feelings` |
| Made a decision | Write why | `feelings` |
| Learned something | Write it down | `project_notes`, `user_context`, `technical_insights`, `world_knowledge` |
| Finished a task | Write reflection + learnings | `feelings` + relevant learning fields |
| Closing a session | Write session summary | all relevant fields |
