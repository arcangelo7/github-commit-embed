import { Editor, Modal, Plugin } from 'obsidian';
import { marked } from 'marked';

interface CommitData {
	sha: string;
	message: string;
	author: {
		login: string;
		avatarUrl: string;
	};
	date: string;
	stats: {
		additions: number;
		deletions: number;
	};
	url: string;
}

class CommitEmbedModal extends Modal {
	private url: string;
	private editor: Editor;
	private commitData: CommitData | null = null;

	constructor(app: import('obsidian').App, url: string, editor: Editor) {
		super(app);
		this.url = url;
		this.editor = editor;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('github-commit-modal');

		contentEl.createEl('h2', { text: 'GitHub Commit Embed' });

		const previewContainer = contentEl.createDiv({ cls: 'commit-preview' });
		previewContainer.setText('Loading commit...');

		try {
			this.commitData = await this.fetchCommit(this.url);
			this.renderPreview(previewContainer);
		} catch (err) {
			previewContainer.setText(`Error: ${(err as Error).message}`);
		}

		this.renderButtons(contentEl);
	}

	private renderPreview(container: HTMLElement) {
		if (!this.commitData) return;

		container.empty();
		container.innerHTML = this.generateHtmlEmbed(this.commitData);
	}

	private renderButtons(contentEl: HTMLElement) {
		const buttonContainer = contentEl.createDiv({ cls: 'commit-modal-buttons' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.gap = '8px';
		buttonContainer.style.marginTop = '16px';
		buttonContainer.style.justifyContent = 'flex-end';

		const embedBtn = buttonContainer.createEl('button', { text: 'Embed' });
		embedBtn.style.backgroundColor = 'var(--interactive-accent)';
		embedBtn.style.color = 'var(--text-on-accent)';
		embedBtn.onclick = () => {
			if (this.commitData) {
				const html = this.generateHtmlEmbed(this.commitData);
				this.editor.replaceSelection(html + '\n\n');
			}
			this.close();
		};

		const textBtn = buttonContainer.createEl('button', { text: 'Paste as text' });
		textBtn.onclick = () => {
			this.editor.replaceSelection(this.url);
			this.close();
		};

		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => {
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private parseCommitUrl(url: string): { owner: string; repo: string; sha: string } | null {
		const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]+)/i);
		if (!match) return null;
		return { owner: match[1], repo: match[2], sha: match[3] };
	}

	private async fetchCommit(url: string): Promise<CommitData> {
		const parsed = this.parseCommitUrl(url);
		if (!parsed) {
			throw new Error('Invalid GitHub commit URL');
		}

		const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits/${parsed.sha}`;
		const response = await fetch(apiUrl, {
			headers: {
				'Accept': 'application/vnd.github.v3+json'
			}
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		const data = await response.json();

		return {
			sha: data.sha,
			message: data.commit.message,
			author: {
				login: data.author?.login || data.commit.author.name,
				avatarUrl: data.author?.avatar_url || ''
			},
			date: data.commit.author.date,
			stats: {
				additions: data.stats?.additions || 0,
				deletions: data.stats?.deletions || 0
			},
			url: data.html_url
		};
	}

	private formatDate(isoDate: string): string {
		return new Date(isoDate).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	private generateHtmlEmbed(commit: CommitData): string {
		const messageHtml = marked.parse(commit.message, { async: false }) as string;

		const avatarHtml = commit.author.avatarUrl
			? `<img src="${commit.author.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%;" alt="${commit.author.login}" />`
			: '';

		return `<div style="border: 1px solid #d0d7de; border-radius: 8px; padding: 16px; margin: 8px 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1f2328;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
    ${avatarHtml}
    <div>
      <strong style="display: block; color: #1f2328;">${commit.author.login}</strong>
      <span style="font-size: 0.85em; color: #656d76;">${this.formatDate(commit.date)}</span>
    </div>
  </div>
  <div style="margin: 12px 0; color: #1f2328;">
    ${messageHtml}
  </div>
  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85em;">
    <span style="font-family: monospace; color: #1a7f37; font-weight: 600;">+${commit.stats.additions}</span>
    <span style="font-family: monospace; color: #cf222e; font-weight: 600;">-${commit.stats.deletions}</span>
    <a href="${commit.url}" style="color: #0969da; text-decoration: none; font-weight: 500;">${commit.sha.substring(0, 7)}</a>
  </div>
</div>`;
	}
}

export default class GitHubCommitEmbedPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on('editor-paste', (evt: ClipboardEvent, editor: Editor) => {
				const text = evt.clipboardData?.getData('text/plain')?.trim();
				if (text && this.isGitHubCommitUrl(text)) {
					evt.preventDefault();
					new CommitEmbedModal(this.app, text, editor).open();
				}
			})
		);
	}

	private isGitHubCommitUrl(text: string): boolean {
		return /^https?:\/\/github\.com\/[^/]+\/[^/]+\/commit\/[a-f0-9]+$/i.test(text);
	}
}
