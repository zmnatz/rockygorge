import type { Finding } from './plan';

// Hidden marker: the workflow finds its own comment by this and updates it
// in place instead of adding a new one per run.
export const COMMENT_MARKER = '<!-- deploy-preview-screenshots -->';

export interface ReportPage {
  path: string;
  url: string;
  status: number | null;
  shots: string[];
  findings: Finding[];
  notes: string[];
}

export interface CommentInput {
  pages: ReportPage[];
  // Raw URL folder holding this run's PNGs on the screenshots branch.
  imageBaseUrl: string;
  runUrl: string;
  previewUrl: string;
  sha: string;
}

function shotLabel(pagePath: string, file: string): string {
  const viewport = file.replace(/\.png$/, '').split('-').pop();
  return `${pagePath} ${viewport}`;
}

function pageSection(page: ReportPage, imageBaseUrl: string): string {
  const lines = [`### [\`${page.path}\`](${page.url})`];
  if (page.status !== 200) {
    lines.push(`**HTTP ${page.status ?? 'error'}**: the page did not load cleanly.`);
  }
  if (page.shots.length > 0) {
    lines.push(
      page.shots
        .map((file) => `![${shotLabel(page.path, file)}](${imageBaseUrl}/${file})`)
        .join('\n')
    );
  }
  for (const note of page.notes) {
    lines.push(`- ${note}`);
  }
  if (page.findings.length === 0) {
    lines.push('No console errors or failed requests.');
  } else {
    lines.push('Console and network findings:');
    for (const finding of page.findings) {
      lines.push(`- \`${finding.kind}\` ${finding.text}`);
    }
  }
  return lines.join('\n\n');
}

export function buildComment(input: CommentInput): string {
  const { pages, imageBaseUrl, runUrl, previewUrl, sha } = input;
  const parts = [
    COMMENT_MARKER,
    `## Deploy preview screenshots`,
    `Captured from ${previewUrl} at \`${sha.slice(0, 7)}\` ([run](${runUrl})).`,
  ];
  if (pages.length === 1 && pages[0].path === '/') {
    parts.push(
      '> Only the home page was captured. Add a `## Screenshots` section to the PR description listing paths (one per line) to capture more.'
    );
  }
  parts.push(...pages.map((page) => pageSection(page, imageBaseUrl)));
  return parts.join('\n\n');
}
