import { Octokit } from 'octokit';
import { RequestError } from '@octokit/request-error';
import { dump, load } from 'js-yaml';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const config = {
    path: '/api/submit-gauntlet',
};

interface RepoFileContent {
    content?: string;
    sha?: string;
}

interface GauntletEntry {
    name: string;
    time: string;
    position?: string;
    stroke?: number;
}

type UpdateFileParams = import('@octokit/plugin-rest-endpoint-methods').RestEndpointMethodTypes['repos']['createOrUpdateFileContents']['parameters'];

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { name, position, time, stroke } = body;

        if (!name || !time) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name and Time are required' }),
            };
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'dummy-token';
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const OWNER = 'zmnatz';
        const REPO = 'rockygorge';
        const FILE_PATH = 'content/gauntlet/index.yml';
        const baseBranch = 'master';
        const { data: refData } = await octokit.rest.git.getRef({
            owner: OWNER,
            repo: REPO,
            ref: `heads/${baseBranch}`,
        });


        // 2. Create new branch
        const branchName = `gauntlet-submit-${Date.now()}`;
        await octokit.rest.git.createRef({
            owner: OWNER,
            repo: REPO,
            ref: `refs/heads/${branchName}`,
            sha: refData.object.sha,
        });

        // 3. Get current file content from base branch
        let fileData: RepoFileContent | undefined;
        let entries: GauntletEntry[] = [];
        try {
            const response = await octokit.rest.repos.getContent({
                owner: OWNER,
                repo: REPO,
                path: FILE_PATH,
                ref: baseBranch,
            });
            fileData = response.data as RepoFileContent;
            const content = Buffer.from(fileData.content || '', 'base64').toString();
            const parsed = load(content);
            entries = (Array.isArray(parsed) ? parsed : []) as GauntletEntry[];
        } catch (error: unknown) {
            if (!(error instanceof RequestError) || error.status !== 404) throw error;
        }

        if (!Array.isArray(entries)) {
            entries = [];
        }

        // 4. Update entries
        const newEntry = {
            name,
            time,
            position: position || undefined,
            stroke: stroke ? Number(stroke) : undefined,
        };
        entries.push(newEntry);

        const updatedYaml = dump(entries);

        // 5. Push to new branch
        console.log(`Pushing update to branch ${branchName} for file ${FILE_PATH}`);
        const updateParams: UpdateFileParams = {
            owner: OWNER,
            repo: REPO,
            path: FILE_PATH,
            message: `Add gauntlet entry for ${name}`,
            content: Buffer.from(updatedYaml).toString('base64'),
            branch: branchName,
        };

        if (fileData?.sha) {
            console.log(`Using existing file SHA: ${fileData.sha}`);
            updateParams.sha = fileData.sha;
        } else {
            console.log('No existing file found, creating new file');
        }

        const commitResponse = await octokit.rest.repos.createOrUpdateFileContents(updateParams);
        console.log(`File update response:`, commitResponse.data);

        // 6. Create Pull Request
        await octokit.rest.pulls.create({
            owner: OWNER,
            repo: REPO,
            title: `Gauntlet Submission: ${name}`,
            head: branchName,
            base: baseBranch,
            body: `New gauntlet entry submitted via website:\n\n- Name: ${name}\n- Time: ${time}\n- Position: ${position || 'N/A'}\n- Stroke Rate: ${stroke || 'N/A'}`,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Successfully submitted' }),
        };
    } catch (error: unknown) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
        };
    }
};
