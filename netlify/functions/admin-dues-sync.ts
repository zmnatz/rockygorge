import { Octokit } from 'octokit';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { NetlifyFunctionContext } from '../../src/types/netlify-context';
import type { Dues } from '../../src/types/data';
import { internalServerError, methodNotAllowed, requireAuth } from '../../src/utils/admin-auth';

const FILE_PATH = 'content/admin/dues.yaml';
const OWNER = 'zmnatz';
const REPO = 'rockygorge';
const BASE_BRANCH = 'master';

interface DuesBlock {
  name: string;
  date: string;
  text: string;
}

interface RepoFileContent {
  content?: string;
  sha?: string;
}

/** Split the ledger into per-person blocks, preserving the file's formatting. */
export function splitLedgerBlocks(fileContent: string): DuesBlock[] {
  const starts: number[] = [];
  for (const match of fileContent.matchAll(/^- name: /gm)) {
    starts.push(match.index as number);
  }
  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : fileContent.length;
    const text = fileContent.slice(start, end).replace(/\s+$/, '');
    return {
      name: (text.match(/- name: (.+)/)?.[1] ?? '').trim(),
      date: (text.match(/date:\s+(\d{4}-\d{2}-\d{2})/)?.[1] ?? '').trim(),
      text,
    };
  });
}

/** Render a block matching the hand-written ledger style. */
export function renderDuesBlock(entry: Dues): string {
  const lines = [`- name: ${entry.name}`];
  if (entry.monthly) lines.push('  monthly: true');
  if (entry.supporter) lines.push('  supporter: true');
  lines.push(`  date: ${entry.date}`);
  return lines.join('\n');
}

/** Merge candidate entries into the ledger: skip anyone already present, slot
 *  new rows into date-desc position, and touch none of the existing text. */
export function mergeLedgerRows(
  currentContent: string,
  entries: Dues[],
): { updated: DuesBlock[]; added: DuesBlock[]; skipped: string[] } {
  const blocks = splitLedgerBlocks(currentContent);
  const existingNames = new Set(blocks.map((block) => block.name.toLowerCase()));

  const { added, skipped } = entries.reduce<{
    added: DuesBlock[];
    skipped: string[];
  }>(
    (acc, entry) => {
      if (existingNames.has(entry.name.toLowerCase())) {
        acc.skipped.push(entry.name);
        return acc;
      }
      acc.added.push({
        name: entry.name,
        date: entry.date,
        text: renderDuesBlock(entry),
      });
      return acc;
    },
    { added: [], skipped: [] },
  );

  const updated = [...blocks];
  for (const entry of added.sort((a, b) => b.date.localeCompare(a.date))) {
    const insertionPoint = updated.findIndex(
      (block) => block.date !== '' && block.date <= entry.date,
    );
    updated.splice(insertionPoint === -1 ? updated.length : insertionPoint, 0, entry);
  }

  return { updated, added, skipped };
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: NetlifyFunctionContext,
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod !== 'POST') {
    return methodNotAllowed();
  }

  const authError = requireAuth(context);
  if (authError) return authError;

  try {
    const body = JSON.parse(event.body || '{}');
    const entries: Dues[] | undefined = body.entries;
    if (!Array.isArray(entries)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'entries must be an array of ledger rows.' }),
      };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GITHUB_TOKEN is not configured.' }),
      };
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const { data: fileResponse } = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
      ref: BASE_BRANCH,
    });
    const fileData = fileResponse as RepoFileContent;
    if (!fileData.content) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Could not read the current dues ledger.' }),
      };
    }
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const { added, skipped, updated } = mergeLedgerRows(currentContent, entries);

    if (added.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No new payers to add — everyone is already on the ledger.',
          added: 0,
          skipped: skipped.length,
        }),
      };
    }

    const updatedContent = `${updated.map((block) => block.text).join('\n')}\n`;

    const { data: refData } = await octokit.rest.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BASE_BRANCH}`,
    });

    const branchName = `dues-sync-${Date.now()}`;
    await octokit.rest.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
      message: 'Sync dues ledger with new volume dues payments',
      content: Buffer.from(updatedContent).toString('base64'),
      branch: branchName,
      sha: fileData.sha,
    });

    const { data: pull } = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: 'Sync dues ledger with new volume dues payments',
      head: branchName,
      base: BASE_BRANCH,
      body:
        'Auto-generated by the Sync to Ledger action on the Dues transactions page.\n' +
        `\n- Adding ${added.length} new payers.\n- Skipped ${skipped.length} payers already on the ledger.\n`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Ledger update pulled up — ${added.length} new payer(s). Review PR #${pull.number} to verify names, monthly flags, and supporter flags before merging.`,
        added: added.length,
        skipped: skipped.length,
        number: pull.number,
        html_url: pull.html_url,
      }),
    };
  } catch (error) {
    return internalServerError(error, 'admin-dues-sync');
  }
};