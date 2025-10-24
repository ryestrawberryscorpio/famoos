/**
 * Placeholder Twitter (X) API client.
 *
 * TODO:
 * - Swap to official X SDK or custom REST wrapper
 * - Support posting companion updates and reading timelines / spaces
 */

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export function getTwitterConfig(): TwitterConfig {
  const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET } = process.env;

  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
    throw new Error("Missing Twitter API credentials. Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET.");
  }

  return {
    apiKey: TWITTER_API_KEY,
    apiSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_SECRET,
  };
}

/**
 * Placeholder call that should eventually post status updates
 * and fetch social sentiment for companions.
 */
export async function fetchLatestTweets(_handle: string) {
  // TODO: integrate with Twitter API v2
  throw new Error("fetchLatestTweets is not implemented yet.");
}

export async function postTelemetryPing(_status: string) {
  // TODO: implement once bot workflow is finalized
  throw new Error("postTelemetryPing is not implemented yet.");
}

