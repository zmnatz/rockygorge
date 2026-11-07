import { requestStats } from '../../src/utils/api';

/** Reports a job's CMS use, to show whether time goes on slow responses or rate limits. */
export function logRequestStats(job: string): void {
  const { requests, retries, waitMs, requestMs } = requestStats;
  console.log(
    `${job}: ${requests} CMS requests, ${retries} retries, ${Math.round(requestMs / 1000)}s in requests, ${Math.round(waitMs / 1000)}s waiting to retry.`
  );
}
