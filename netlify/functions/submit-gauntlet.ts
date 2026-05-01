import { Octokit } from 'octokit';
import yaml from 'js-yaml';

export const config = {
    path: '/api/submit-gauntlet',
};

export const handler = async (event: any) => {
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
        const OWNER = 'zmnatz';
        const REPO = 'rockygorge';
        const FILE_PATH = 'src/data/gauntlet/index.yml';
        const baseBranch = 'main';
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
        let fileData;
        let entries = [];
        try {
            const response = await octokit.rest.repos.getContent({
                owner: OWNER,
                repo: REPO,
                path: FILE_PATH,
                ref: baseBranch,
            });
            fileData = response.data as any;
            const content = Buffer.from(fileData.content, 'base64').toString();
            entries = yaml.load(content) || [];
        } catch (error: any) {
            if (error.status !== 404) throw error;
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

        const updatedYaml = yaml.dump(entries);

        // 5. Push to new branch
        console.log(`Pushing update to branch ${branchName} for file ${FILE_PATH}`);
        const updateParams: any = {
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
    } catch (error: any) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
        };
    }
};
