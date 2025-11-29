# GitHub Commit Embed

Embed GitHub commits as beautiful cards in your Obsidian notes. Simply paste a commit URL and choose to embed it as a styled card.

![Screenshot](screenshot.png)

## How it works

1. Copy a GitHub commit URL (e.g., `https://github.com/arcangelo7/github-commit-embed/commit/37f48bffd26329505282d72c1e1ab8298fdc438c`)
2. Paste it in any note
3. A dialog appears with a preview of the commit
4. Choose:
   - **Embed** - Insert a styled card with author, date, message, and stats
   - **Paste as text** - Insert the plain URL 
   - **Cancel** - Do nothing

The embedded card is pure HTML with inline styles, so it renders correctly everywhere - even in other Markdown viewers or when exporting notes.

## Installation

### From community plugins

1. Open Settings > Community plugins
2. Click "Browse" and search for "GitHub Commit Embed"
3. Click "Install", then "Enable"

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/arcangelo7/github-commit-embed/releases)
2. Create folder `.obsidian/plugins/github-commit-embed/` in your vault
3. Copy the downloaded files into the folder
4. Enable the plugin in Settings > Community plugins

## Network usage

This plugin fetches commit data from the **GitHub API** (`api.github.com`) when you paste a commit URL. No data is sent except the commit URL you're embedding. GitHub's API has a rate limit of 60 requests per hour for unauthenticated requests.

## License

MIT