import { Octokit } from 'octokit';
import { RequestError } from '@octokit/request-error';
import { dump } from 'js-yaml';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

interface AdminHandlerConfig {
  filePath: string;
  branchPrefix: string;
  label: string;
}

interface RepoFileContent {
  content?: string;
  sha?: string;
}

/** The Netlify Identity user Netlify injects into `clientContext` when the
 *  request carries a valid Identity JWT in the `Authorization` header. */
interface NetlifyClientContextUser {
  sub?: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

interface NetlifyClientContext {
  user?: NetlifyClientContextUser | null;
}

type NetlifyFunctionContext = {
  clientContext?: NetlifyClientContext;
};

type UpdateFileParams = import('@octokit/plugin-rest-endpoint-methods').RestEndpointMethodTypes['repos']['createOrUpdateFileContents']['parameters'];

export function createAdminHandler({ filePath, branchPrefix, label }: AdminHandlerConfig) {
  return async (event: APIGatewayProxyEvent, context: NetlifyFunctionContext): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === 'POST') {
      if (!context.clientContext?.user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Authentication required. Sign in to the Admin Console and try again.' }),
        };
      }

      try {
        const body = JSON.parse(event.body || '{}');
        const data = body;

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'dummy-token';
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const OWNER = 'zmnatz';
        const REPO = 'rockygorge';
        const baseBranch = 'master';

        const { data: refData } = await octokit.rest.git.getRef({
          owner: OWNER,
          repo: REPO,
          ref: `heads/${baseBranch}`,
        });

        const branchName = `${branchPrefix}-${Date.now()}`;
        await octokit.rest.git.createRef({
          owner: OWNER,
          repo: REPO,
          ref: `refs/heads/${branchName}`,
          sha: refData.object.sha,
        });

        let fileData: RepoFileContent | undefined;
        try {
          const response = await octokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: filePath,
            ref: baseBranch,
          });
          fileData = response.data as RepoFileContent;
        } catch (error: unknown) {
          if (!(error instanceof RequestError) || error.status !== 404) throw error;
        }

        const updatedYaml = dump(data);

        const updateParams: UpdateFileParams = {
          owner: OWNER,
          repo: REPO,
          path: filePath,
          message: `Update ${filePath.split('/').pop()}`,
          content: Buffer.from(updatedYaml).toString('base64'),
          branch: branchName,
        };

        if (fileData?.sha) {
          updateParams.sha = fileData.sha;
        }

        await octokit.rest.repos.createOrUpdateFileContents(updateParams);

        await octokit.rest.pulls.create({
          owner: OWNER,
          repo: REPO,
          title: `Update ${filePath.split('/').pop()}`,
          head: branchName,
          base: baseBranch,
          body: `Updated ${label} data via admin page`,
        });

        return {
          statusCode: 200,
          body: JSON.stringify({ message: `Successfully updated ${label} data and created a PR` }),
        };
      } catch (error: unknown) {
        console.error(error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
        };
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  };
}
