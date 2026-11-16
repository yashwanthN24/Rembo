import { fetchLatestRelease } from '../src/lib/release.ts';

interface VercelRequestLike {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelResponseLike {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => VercelResponseLike;
  json: (body: unknown) => void;
}

export default async function handler(req: VercelRequestLike, res: VercelResponseLike) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const refreshParam = req.query?.refresh;
  const forceRefresh = refreshParam === '1' || refreshParam === 'true';

  const result = await fetchLatestRelease({ forceRefresh });

  if (forceRefresh) {
    res.setHeader('Cache-Control', 'no-store');
  } else {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  if (!result.ok) {
    res.status(result.status).json({
      ok: false,
      error: result.error,
    });
    return;
  }

  res.status(200).json({
    ok: true,
    release: result.release,
    cached: result.cached,
  });
}
