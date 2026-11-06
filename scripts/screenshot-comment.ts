import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { buildComment, type ReportPage } from './lib/screenshot-comment';

// Turns screenshots/report.json into the sticky PR comment body.
//   bun scripts/screenshot-comment.ts --report screenshots/report.json \
//     --image-base-url <raw url folder> --run-url <url> --sha <sha> --out comment.md
const { values } = parseArgs({
  options: {
    report: { type: 'string' },
    'image-base-url': { type: 'string' },
    'run-url': { type: 'string' },
    sha: { type: 'string' },
    out: { type: 'string' },
  },
});
const report = JSON.parse(fs.readFileSync(values.report as string, 'utf-8')) as {
  baseUrl: string;
  pages: ReportPage[];
};
fs.writeFileSync(
  values.out as string,
  buildComment({
    pages: report.pages,
    imageBaseUrl: values['image-base-url'] as string,
    runUrl: values['run-url'] as string,
    previewUrl: report.baseUrl,
    sha: values.sha as string,
  })
);
