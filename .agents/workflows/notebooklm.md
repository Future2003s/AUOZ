---
description: Use NotebookLM via CLI (nlm) — manage notebooks, query AI, add sources, create content
---

# NotebookLM CLI Workflow

> **Prerequisite:** `pip install notebooklm-mcp-cli` and `nlm auth login` completed.

## Common Commands

### List notebooks
// turbo
1. Run: `nlm notebook list`

### Create a new notebook
1. Run: `nlm notebook create "Tên notebook"`

### Query AI in a notebook
1. Run: `nlm notebook list` to get the notebook ID
2. Run: `nlm notebook query --notebook <ID> "câu hỏi của bạn"`

### Add a source (URL, file, text)
1. Run: `nlm notebook list` to get the notebook ID
2. Run: `nlm source add --notebook <ID> --url "https://..."` (for URL)
   Or: `nlm source add --notebook <ID> --file "path/to/file.pdf"` (for file)
   Or: `nlm source add --notebook <ID> --text "nội dung"` (for plain text)

### Create audio/video studio content
1. Run: `nlm studio create --notebook <ID> --type audio`

### Research on the web and add results to notebook
1. Run: `nlm research start --notebook <ID> "chủ đề nghiên cứu"`

### Batch operations
1. Run: `nlm batch query "câu hỏi" --all` to query across all notebooks
2. Run: `nlm batch create --notebooks <ID1>,<ID2> --source "url"` to add source to multiple notebooks

### Check auth & diagnose issues
// turbo
1. Run: `nlm doctor`

### MCP Server setup (for AI assistant integration)
// turbo
1. Run: `nlm setup add antigravity`
2. Restart your AI assistant to load the MCP server
