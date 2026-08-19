import { Octokit } from 'octokit';
import { load, dump } from 'js-yaml';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { NetlifyFunctionContext } from '../../src/types/netlify-context';
import { internalServerError, methodNotAllowed, requireAuth } from '../../src/utils/admin-auth';
import { ADMIN_FILE_PATHS } from '../../src/utils/admin-file-paths';
import { mergeSupporters } from '../../src/utils/dues-diff';

export const config = {
  path: '/api/admin-supporters',
};

const OWNER = 'zmnatz';
const REPO = 'rockygorge';
const BASE_BRANCH = 'master';
const SUPPORTERS_SLUG = 'supporters';
const STORE_FILE = ADMIN_FILE_PATHS.store;

interface RepoFileContent {
  content?: string;
  sha?: string;
}

interface SupportersCommitResponse {
  message: string;
  prUrl: string;
}

function validateNames(names: unknown): names is string[] {
  return (
    Array.isArray(names) &&
    names.length > 0 &&
    names.every((name) => typeof name === 'string' && name.trim() !== '')
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
    const names = body.names;
    if (!validateNames(names)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'names (a non-empty array of strings) is required.',
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
      path: STORE_FILE,
      ref: BASE_BRANCH,
    });
    const fileData = fileResponse.data as RepoFileContent;
    const store = (load(
      Buffer.from(fileData.content ?? '', 'base64').toString('utf8'),
    ) ?? []) as Array<Record<string, unknown>>;

    const supportersItem = store.find((item) => item.slug === SUPPORTERS_SLUG);
    if (!supportersItem) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `No store item with slug "${SUPPORTERS_SLUG}" found.` }),
      };
    }

    const existing = Array.isArray(supportersItem.supporters)
      ? (supportersItem.supporters as unknown[]).filter(
          (name): name is string => typeof name === 'string',
        )
      : [];
    supportersItem.supporters = mergeSupporters(existing, names);

    const updatedYaml = dump(store);

    const branchName = `admin-supporters-${Date.now()}`;
    await octokit.rest.git.createRef({
      owner: OWNER,
      repo: REPO,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: STORE_FILE,
      message: `Add ${names.length} new supporter${names.length === 1 ? '' : 's'} to the supporters list`,
      content: Buffer.from(updatedYaml).toString('base64'),
      branch: branchName,
      sha: fileData.sha,
    });

    const pull = await octokit.rest.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: `Add ${names.length} new supporter${names.length === 1 ? '' : 's'} to the supporters list`,
      head: branchName,
      base: BASE_BRANCH,
      body: 'New GODs Tier payments detected from PayPal transactions were added to the supporters list.',
    });

    const response: SupportersCommitResponse = {
      message: `Added ${names.length} new supporter${names.length === 1 ? '' : 's'} and created a PR.`,
      prUrl: pull.data.html_url ?? '',
    };
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    return internalServerError(error, 'admin-supporters');
  }
};
