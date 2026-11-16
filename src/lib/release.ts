export const GITHUB_REPO_OWNER = 'yashwanthN24';
export const GITHUB_REPO_NAME = 'FlutterAppDevelopment';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
export const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

export interface ApkAssetInfo {
  name: string;
  size: number;
  downloadUrl: string;
  contentType: string;
  digest: string | null;
  downloadCount: number;
  updatedAt: string;
}

export interface ReleaseInfo {
  tagName: string;
  releaseName: string;
  publishedAt: string;
  body: string;
  htmlUrl: string;
  repoUrl: string;
  apk: ApkAssetInfo | null;
  allApkAssets: ApkAssetInfo[];
  fetchedAt: string;
}

export interface ReleaseApiResponse {
  ok: boolean;
  release?: ReleaseInfo;
  cached?: boolean;
  error?: string;
}

interface GitHubAssetPayload {
  name?: string;
  size?: number;
  browser_download_url?: string;
  content_type?: string;
  digest?: string | null;
  download_count?: number;
  updated_at?: string;
  state?: string;
}

interface GitHubReleasePayload {
  tag_name?: string;
  name?: string | null;
  published_at?: string;
  created_at?: string;
  body?: string | null;
  html_url?: string;
  assets?: GitHubAssetPayload[];
  message?: string;
}

const CACHE_TTL_MS = 60_000;

let cachedRelease: ReleaseInfo | null = null;
let cachedAtMs = 0;

export function selectApkAssets(assets: GitHubAssetPayload[] | undefined): ApkAssetInfo[] {
  if (!Array.isArray(assets)) {
    return [];
  }

  return assets
    .filter((asset) => {
      if (!asset.name || !asset.browser_download_url) {
        return false;
      }
      const isUploaded = !asset.state || asset.state === 'uploaded';
      return isUploaded && asset.name.toLowerCase().endsWith('.apk');
    })
    .map((asset) => ({
      name: asset.name ?? 'release.apk',
      size: typeof asset.size === 'number' ? asset.size : 0,
      downloadUrl: asset.browser_download_url ?? '',
      contentType: asset.content_type || 'application/vnd.android.package-archive',
      digest: typeof asset.digest === 'string' && asset.digest.length > 0 ? asset.digest : null,
      downloadCount: typeof asset.download_count === 'number' ? asset.download_count : 0,
      updatedAt: asset.updated_at || '',
    }));
}

export function pickPrimaryApk(apkAssets: ApkAssetInfo[]): ApkAssetInfo | null {
  if (apkAssets.length === 0) {
    return null;
  }
  const preferred = apkAssets.find((asset) => asset.name.toLowerCase() === 'app-release.apk');
  if (preferred) {
    return preferred;
  }
  const universal = apkAssets.find((asset) => asset.name.toLowerCase().includes('universal'));
  return universal ?? apkAssets[0];
}

export function normalizeGitHubRelease(payload: GitHubReleasePayload): ReleaseInfo {
  const tagName = (payload.tag_name || '').trim();
  const releaseName = (payload.name || tagName || 'Latest Release').trim();
  const publishedAt = payload.published_at || payload.created_at || '';
  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  const htmlUrl = payload.html_url || `${GITHUB_REPO_URL}/releases`;
  const allApkAssets = selectApkAssets(payload.assets);
  const apk = pickPrimaryApk(allApkAssets);

  return {
    tagName,
    releaseName,
    publishedAt,
    body,
    htmlUrl,
    repoUrl: GITHUB_REPO_URL,
    apk,
    allApkAssets,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchLatestRelease(options?: {
  forceRefresh?: boolean;
}): Promise<{ ok: true; release: ReleaseInfo; cached: boolean } | { ok: false; status: number; error: string }> {
  const now = Date.now();
  const forceRefresh = Boolean(options?.forceRefresh);

  if (!forceRefresh && cachedRelease && now - cachedAtMs < CACHE_TTL_MS) {
    return {
      ok: true,
      release: cachedRelease,
      cached: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(GITHUB_LATEST_RELEASE_API, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'NeverMissAlerts-APK-Portal',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let detail = `GitHub Releases API returned HTTP ${response.status}`;
      try {
        const errBody = (await response.json()) as { message?: string };
        if (errBody?.message) {
          detail = errBody.message;
        }
      } catch {
        // Ignore non-JSON error body
      }

      if (!forceRefresh && cachedRelease) {
        return {
          ok: true,
          release: cachedRelease,
          cached: true,
        };
      }

      return {
        ok: false,
        status: response.status === 404 ? 404 : 502,
        error:
          response.status === 404
            ? 'No published releases were found for this repository yet.'
            : `Unable to reach GitHub Releases (${detail}).`,
      };
    }

    const payload = (await response.json()) as GitHubReleasePayload;
    if (!payload.tag_name) {
      return {
        ok: false,
        status: 502,
        error: 'GitHub returned an incomplete release payload without a version tag.',
      };
    }

    const release = normalizeGitHubRelease(payload);
    cachedRelease = release;
    cachedAtMs = Date.now();

    return {
      ok: true,
      release,
      cached: false,
    };
  } catch (err) {
    if (!forceRefresh && cachedRelease) {
      return {
        ok: true,
        release: cachedRelease,
        cached: true,
      };
    }

    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Timed out while waiting for the GitHub Releases API.'
        : 'Unable to connect to the GitHub Releases API.';

    return {
      ok: false,
      status: 503,
      error: message,
    };
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return 'Unknown size';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = unitIndex >= 2 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export function formatReleaseDate(isoDate: string): string {
  if (!isoDate) {
    return 'Unknown date';
  }
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}
