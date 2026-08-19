import { Octokit } from 'octokit';
import { load, dump } from 'js-yaml';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { NetlifyFunctionContext } from '../../src/types/netlify-context';
import type { Dues } from '../../src/types/data';
import { internalServerError, methodNotAllowed, requireAuth } from '../../src/utils/admin-auth';
import { ADMIN_FILE_PATHS } from '../../src/utils/admin-file-paths';
import { mergeDues } from '../../src/utils/dues-diff';

export const config = {
  path: '/api/admin-dues',
};

const OWNER = 'zmnatz';
const REPO = 'rockygorge';
const BASE_BRANCH = 'master';
const DUES_FILE = ADMIN_FILE_PATHS.dues;

interface RepoFileContent {
  content?: string;
  sha?: string;
}

interface DuesCommitResponse {
  message: string;
  prUrl: string;
}

function validateEntries(entries: unknown): entries is Dues[] {
  return (
    Array.isArray(entries) &&
    entries.length > 0 &&
    entries.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Dues).name === 'string' &&
        (entry as Dues).name.trim() !== '' &&
        typeof (entry as Dues).date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test((entry as Dues).date),
    )
  );
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
    const newEntries = body.newEntries;
    if (!validateEntries(newEntries)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'newEntries (a non-empty array of { name, date, monthly? } objects) is required.',
        }),
      };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'dummy-token';
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    const { data: refData } = await octokit.rest.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BASE_BRANCH}`,
    });

    const fileResponse = await octokit.rest.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: DUES_FILE,
      ref: BASE_BRANCH,
    });
    const fileData = fileResponse.data as RepoFileContent;
    const existing = (load(
      Buffer.from(fileData.content ?? '', 'base64').toString('utf8'),
    ) ?? []) as Dues[];

    const merged = mergeDues(existing, newEntries);
    const updatedYaml = dump(merged);

    const branchName = `admin-dues-${Date.now()}`;
    await octokit.rest.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: DUES_FILE,
      message: `Add ${newEntries.length} new dues payment${newEntries.length === 1 ? '' : 's'} to dues record`,
      content: Buffer.from(updatedYaml).toString('base64'),
      branch: branchName,
      sha: fileData.sha,
    });

    const pull = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: `Add ${newEntries.length} new dues payment${newEntries.length === 1 ? '' : 's'} to dues record`,
      head: branchName,
      base: BASE_BRANCH,
      body: 'New dues payments detected from PayPal transactions were added to the dues record.',
    });

    const response: DuesCommitResponse = {
      message: `Added ${newEntries.length} new dues payment${newEntries.length === 1 ? '' : 's'} and created a PR.`,
      prUrl: pull.data.html_url ?? '',
    };
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return internalServerError(error, 'admin-dues');
  }
};
