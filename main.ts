import { Editor, Modal, Plugin, requestUrl, MarkdownRenderer, Component } from 'obsidian';
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
	owner: string;
	repo: string;
}

interface GitHubCommitResponse {
	sha: string;
	html_url: string;
	commit: {
		message: string;
		author: {
			name: string;
			date: string;
		};
	};
	author?: {
		login: string;
		avatar_url: string;
	};
	stats?: {
		additions: number;
		deletions: number;
	};
}

class CommitEmbedModal extends Modal {
	private url: string;
	private editor: Editor;
	private commitData: CommitData | null = null;
	private component = new Component();

	constructor(app: import('obsidian').App, url: string, editor: Editor) {
		super(app);
		this.url = url;
		this.editor = editor;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('github-commit-modal');

		contentEl.createEl('h2', { text: 'GitHub commit embed' });

		const previewContainer = contentEl.createDiv({ cls: 'commit-preview' });
		previewContainer.setText('Loading commit...');

		try {
			this.commitData = await this.fetchCommit(this.url);
			await this.renderPreview(previewContainer);
		} catch (err) {
			previewContainer.setText(`Error: ${(err as Error).message}`);
		}

		this.renderButtons(contentEl);
	}

	private async renderPreview(container: HTMLElement) {
		if (!this.commitData) return;

		container.empty();
		await this.buildCommitCard(container, this.commitData);
	}

	private async buildCommitCard(container: HTMLElement, commit: CommitData) {
		const card = container.createDiv({ cls: 'github-commit-card' });

		const header = card.createDiv({ cls: 'github-commit-header' });
		if (commit.author.avatarUrl) {
			header.createEl('img', {
				cls: 'github-commit-avatar',
				attr: { src: commit.author.avatarUrl, alt: commit.author.login }
			});
		}
		const authorInfo = header.createDiv({ cls: 'github-commit-author-info' });
		authorInfo.createEl('strong', { text: commit.author.login });
		const metaInfo = authorInfo.createEl('span', { cls: 'github-commit-meta' });
		metaInfo.createEl('span', { text: this.formatDate(commit.date), cls: 'github-commit-date' });
		metaInfo.createEl('span', { text: ' · ' });
		metaInfo.createEl('a', {
			text: `${commit.owner}/${commit.repo}`,
			cls: 'github-commit-repo',
			attr: { href: `https://github.com/${commit.owner}/${commit.repo}` }
		});

		const messageDiv = card.createDiv({ cls: 'github-commit-message' });
		await MarkdownRenderer.render(this.app, commit.message, messageDiv, '', this.component);

		const footer = card.createDiv({ cls: 'github-commit-footer' });
		footer.createEl('span', { text: `+${commit.stats.additions}`, cls: 'github-commit-additions' });
		footer.createEl('span', { text: `-${commit.stats.deletions}`, cls: 'github-commit-deletions' });
		footer.createEl('a', {
			text: commit.sha.substring(0, 7),
			cls: 'github-commit-sha',
			attr: { href: commit.url }
		});
	}



	private renderButtons(contentEl: HTMLElement) {
		const buttonContainer = contentEl.createDiv({ cls: 'github-commit-modal-buttons' });

		const embedBtn = buttonContainer.createEl('button', { text: 'Embed', cls: 'mod-cta' });
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
		this.component.unload();
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
		const response = await requestUrl({
			url: apiUrl,
			headers: {
				'Accept': 'application/vnd.github.v3+json'
			}
		});

		const data = response.json as GitHubCommitResponse;

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
			url: data.html_url,
			owner: parsed.owner,
			repo: parsed.repo
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
		const messageHtml = marked.parse(commit.message, { async: false });

		const avatarHtml = commit.author.avatarUrl
			? `<img src="${commit.author.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%;" alt="${commit.author.login}" />`
			: '';

		return `<div style="border: 1px solid #d0d7de; border-radius: 8px; padding: 16px; margin: 8px 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1f2328;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
    ${avatarHtml}
    <div>
      <strong style="display: block; color: #1f2328;">${commit.author.login}</strong>
      <span style="font-size: 0.85em; color: #656d76;">${this.formatDate(commit.date)}</span>
      <span style="font-size: 0.85em; color: #656d76;"> · </span>
      <a href="https://github.com/${commit.owner}/${commit.repo}" style="font-size: 0.85em; color: #0969da; text-decoration: none;">${commit.owner}/${commit.repo}</a>
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
	onload() {
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
