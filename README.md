# GitHub Commit Embed

Obsidian plugin that auto-detects GitHub commit URLs when you paste them and offers to embed them as portable HTML cards.

## Features

- **Auto-detection**: When you paste a GitHub commit URL, a modal appears asking if you want to embed it
- **Portable HTML**: The embed is pure HTML with inline styles, so it renders correctly even without the plugin (in any Markdown viewer)
- **Full commit message**: The complete commit message is preserved with Markdown formatting (lists, bold, code, etc.)
- **Commit metadata**: Shows author avatar, name, date, additions/deletions stats, and link to the commit

## Usage

1. Copy a GitHub commit URL (e.g., `https://github.com/owner/repo/commit/abc123`)
2. Paste it in any Obsidian note
3. A modal appears with a preview of the commit
4. Click **Embed** to insert the HTML card, **Paste as text** to insert the plain URL, or **Cancel** to abort

## Installation

### Manual installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/arcangelo7/github-commit-embed/releases)
2. Create a folder `github-commit-embed` in your vault's `.obsidian/plugins/` directory
3. Copy `main.js` and `manifest.json` into the folder
4. Enable the plugin in Obsidian settings (Settings > Community plugins)

### From source

```bash
git clone https://github.com/arcangelo7/github-commit-embed
cd github-commit-embed
npm install
npm run build
```

Then copy or symlink the folder to your vault's `.obsidian/plugins/` directory.

## Development

```bash
npm run dev    # Watch mode, auto-rebuild on changes
npm run build  # Production build
```

## Limitations

- GitHub API rate limit: 60 requests/hour without authentication. For heavy usage, a future version may add support for GitHub personal access tokens.

## License

MIT
