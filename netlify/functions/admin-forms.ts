import { Octokit } from 'octokit';
import yaml from 'js-yaml';

export const config = {
    path: '/api/admin-forms',
};

export const handler = async (event: any) => {
    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);
            const data = body;

            const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'dummy-token';
            const octokit = new Octokit({ auth: GITHUB_TOKEN });
            const OWNER = 'zmnatz';
            const REPO = 'rockygorge';
            const FILE_PATH = 'src/data/forms.yml';
            const baseBranch = 'master';

            const { data: refData } = await octokit.rest.git.getRef({
                owner: OWNER,
                repo: REPO,
                ref: `heads/${baseBranch}`,
            });

            const branchName = `admin-forms-${Date.now()}`;
            await octokit.rest.git.createRef({
                owner: OWNER,
                repo: REPO,
                ref: `refs/heads/${branchName}`,
                sha: refData.object.sha,
            });

            let fileData;
            try {
                const response = await octokit.rest.repos.getContent({
                    owner: OWNER,
                    repo: REPO,
                    path: FILE_PATH,
                    ref: baseBranch,
                });
                fileData = response.data as any;
            } catch (error: any) {
                if (error.status !== 404) throw error;
            }

            const updatedYaml = yaml.dump(data);

            const updateParams: any = {
                owner: OWNER,
                repo: REPO,
                path: FILE_PATH,
                message: 'Update forms.yml',
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
                title: 'Update forms.yml',
                head: branchName,
                base: baseBranch,
                body: 'Updated forms data via admin page',
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Successfully updated forms data and created a PR' }),
            };
        } catch (error: any) {
            console.error(error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
};
