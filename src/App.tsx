import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  GITHUB_REPO_URL,
  type ReleaseApiResponse,
  type ReleaseInfo,
  formatFileSize,
  formatReleaseDate,
} from './lib/release';
import { ReleaseNotes } from './components/ReleaseNotes';

const APP_ICON_SRC = '/src/assets/images/app_icon_alerts_1794852963570.jpg';
const HERO_MEDIA_SRC = '/src/assets/images/hero_mobile_alerts_1794852965918.jpg';

type DownloadState = 'idle' | 'preparing' | 'started';

export default function App() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [copiedDigest, setCopiedDigest] = useState<boolean>(false);
  const [iconLoadFailed, setIconLoadFailed] = useState<boolean>(false);
  const [heroLoadFailed, setHeroLoadFailed] = useState<boolean>(false);

  const loadRelease = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const endpoint = forceRefresh ? '/api/release?refresh=1' : '/api/release';
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
      });

      const data = (await response.json()) as ReleaseApiResponse;

      if (!response.ok || !data.ok || !data.release) {
        setRelease(null);
        setError(data.error || 'Unable to retrieve the latest release from GitHub.');
        return;
      }

      setRelease(data.release);
    } catch {
      setRelease(null);
      setError('Unable to reach the release service. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRelease(false);
  }, [loadRelease]);

  const handleDownloadApk = useCallback(() => {
    if (!release?.apk?.downloadUrl || downloadState === 'preparing') {
      return;
    }

    const { downloadUrl, name } = release.apk;
    setDownloadState('preparing');

    // Brief 150ms feedback transition before initiating the native browser download
    window.setTimeout(() => {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', name);
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadState('started');
      window.setTimeout(() => {
        setDownloadState((current) => (current === 'started' ? 'idle' : current));
      }, 4500);
    }, 150);
  }, [release, downloadState]);

  const handleCopyDigest = useCallback(async () => {
    if (!release?.apk?.digest) return;
    const cleanDigest = release.apk.digest.replace(/^sha256:/i, '');
    try {
      await navigator.clipboard.writeText(cleanDigest);
      setCopiedDigest(true);
      window.setTimeout(() => setCopiedDigest(false), 2000);
    } catch {
      // Clipboard API unavailable in non-secure contexts
    }
  }, [release]);

  const hasApk = Boolean(release?.apk?.downloadUrl);
  const canDownload = !loading && !error && hasApk;

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 flex flex-col">
      {/* Top Navigation Bar: strict 3-zone contract */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0A0B0E]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#overview"
            className="text-base font-semibold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
          >
            Never Miss Alerts
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
          >
            <a
              href="#overview"
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-50 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              Overview
            </a>
            <a
              href="#release-notes"
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-50 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              Release Notes
            </a>
            <a
              href="#install-guide"
              className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-50 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              Install Guide
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-50 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              GitHub
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={
                canDownload
                  ? handleDownloadApk
                  : () => {
                      document.getElementById('release-notes')?.scrollIntoView({ behavior: 'smooth' });
                    }
              }
              disabled={loading || downloadState === 'preparing'}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0B0E]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Checking</span>
                </>
              ) : error ? (
                <span>Release Status</span>
              ) : !hasApk ? (
                <span>No APK</span>
              ) : downloadState === 'preparing' ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Starting</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Download APK</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="overview" className="border-b border-white/8">
          <div className="mx-auto max-w-[1200px] px-6 py-14 lg:py-20">
            <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Left Proposition & Primary Download Action */}
              <div className="flex flex-col justify-between gap-8 lg:col-span-6">
                <div className="space-y-6">
                  {/* Unboxed typographic metadata (no pill enclosures) */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-400">
                    <span>Android Application</span>
                    <span aria-hidden="true">·</span>
                    {loading ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-300">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        Fetching latest release
                      </span>
                    ) : error ? (
                      <span className="text-rose-400">GitHub release unavailable</span>
                    ) : release ? (
                      <span className="font-mono tabular-nums text-amber-400">
                        Latest version {release.tagName}
                        {release.apk ? ` · ${formatFileSize(release.apk.size)}` : ''}
                      </span>
                    ) : null}
                  </div>

                  {/* App Icon + Headline */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#14171F]">
                      {!iconLoadFailed ? (
                        <img
                          src={APP_ICON_SRC}
                          alt="Never Miss Alerts Android app icon"
                          referrerPolicy="no-referrer"
                          onError={() => setIconLoadFailed(true)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/20 via-[#181B22] to-[#0A0B0E]">
                          <Bell className="h-7 w-7 text-amber-400" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h1
                        className="font-bold tracking-tight text-slate-50 leading-[1.08]"
                        style={{
                          fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                          textWrap: 'balance',
                        }}
                      >
                        Never Miss Alerts
                      </h1>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-xl">
                    <p className="text-lg font-medium text-slate-200 leading-relaxed">
                      Never miss an important task or reminder.
                    </p>
                    <p className="text-[15px] text-slate-400 leading-relaxed">
                      Install the latest Android build directly from our official GitHub releases.
                      Every download links straight to the newest published APK with verified file
                      size and release notes.
                    </p>
                  </div>
                </div>

                {/* Primary Download Action & Real State Handling */}
                <div className="space-y-4">
                  {loading ? (
                    <div
                      role="status"
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#12141A] px-5 py-4 text-sm text-slate-300"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400 shrink-0" aria-hidden="true" />
                      <span>Fetching latest release metadata from GitHub...</span>
                    </div>
                  ) : error ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-400 shrink-0" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-rose-200">
                            Unable to load latest GitHub release
                          </p>
                          <p className="text-sm text-rose-300/90 leading-relaxed">{error}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => void loadRelease(true)}
                          disabled={refreshing}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                          />
                          <span>Retry Connection</span>
                        </button>
                        <a
                          href={`${GITHUB_REPO_URL}/releases`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 underline decoration-white/25 underline-offset-4 hover:text-slate-100"
                        >
                          <span>Check GitHub Releases</span>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  ) : release && !release.apk ? (
                    <div
                      role="alert"
                      className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-amber-200">
                            No APK attached to {release.tagName}
                          </p>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            The latest published release ({release.releaseName}) does not currently
                            contain a <code className="font-mono text-amber-300">.apk</code> file in
                            its release assets.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => void loadRelease(true)}
                          disabled={refreshing}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                          />
                          <span>Re-check Assets</span>
                        </button>
                        <a
                          href={release.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-300 underline decoration-amber-400/40 underline-offset-4 hover:text-amber-200"
                        >
                          <span>View Release on GitHub</span>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  ) : release && release.apk ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleDownloadApk}
                          disabled={downloadState === 'preparing'}
                          className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors duration-150 hover:bg-amber-400 active:bg-amber-300 disabled:cursor-wait disabled:opacity-80 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0B0E]"
                        >
                          {downloadState === 'preparing' ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                              <span>Preparing Download...</span>
                            </>
                          ) : downloadState === 'started' ? (
                            <>
                              <Check className="h-4 w-4" aria-hidden="true" />
                              <span>Download Started</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" aria-hidden="true" />
                              <span>Download APK</span>
                            </>
                          )}
                        </button>

                        <a
                          href={release.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/12 bg-[#12141A] px-5 py-3 text-sm font-medium text-slate-200 transition-colors duration-150 hover:border-white/25 hover:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <span>GitHub Repository</span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        </a>
                      </div>

                      {/* Download status feedback or crisp file info line */}
                      {downloadState === 'started' ? (
                        <p role="status" className="text-xs text-emerald-300">
                          Downloading <span className="font-mono">{release.apk.name}</span>. If your
                          browser did not start automatically,{' '}
                          <a
                            href={release.apk.downloadUrl}
                            download={release.apk.name}
                            rel="noopener noreferrer"
                            className="underline decoration-emerald-400/50 underline-offset-4 hover:text-emerald-200"
                          >
                            click here for the direct file link
                          </a>
                          .
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 font-mono tabular-nums">
                          {release.apk.name} · {formatFileSize(release.apk.size)} · Released{' '}
                          {formatReleaseDate(release.publishedAt)}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right Column: Editorial Hardware Visual */}
              <div className="lg:col-span-6 flex">
                <div className="relative w-full min-h-[300px] lg:min-h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[#12141A]">
                  {!heroLoadFailed ? (
                    <img
                      src={HERO_MEDIA_SRC}
                      alt="Never Miss Alerts running on an Android smartphone"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroLoadFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#161922] via-[#101218] to-[#0A0B0E] p-8 text-center">
                      <Smartphone className="h-10 w-10 text-amber-400/80" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-300">Never Miss Alerts for Android</p>
                    </div>
                  )}

                  {/* Measured dark gradient scrim for guaranteed >=4.5:1 contrast */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-[#0A0B0E]/35 to-transparent"
                  />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <div className="grid grid-cols-3 gap-4 border-t border-white/12 pt-4">
                      <div>
                        <p className="text-[11px] font-medium text-slate-400">Latest Tag</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-50 truncate">
                          {loading ? '—' : release ? release.tagName : 'Unavailable'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-400">Release Date</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-50 truncate">
                          {loading
                            ? '—'
                            : release
                              ? formatReleaseDate(release.publishedAt)
                              : 'Unavailable'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-400">APK Size</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-amber-400 truncate">
                          {loading
                            ? '—'
                            : release?.apk
                              ? formatFileSize(release.apk.size)
                              : 'No APK'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Release Information & Changelog Section */}
        <section id="release-notes" className="border-b border-white/8">
          <div className="mx-auto max-w-[1200px] px-6 py-14 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4 pb-8 border-b border-white/8">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-50">
                  Release Information
                </h2>
                <p className="text-sm text-slate-400">
                  Live build metadata retrieved from the public GitHub Releases API.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadRelease(true)}
                disabled={loading || refreshing}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/10 bg-[#12141A] px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <span>{refreshing ? 'Checking GitHub...' : 'Check for Updates'}</span>
              </button>
            </div>

            {loading ? (
              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4 rounded-2xl border border-white/8 bg-[#12141A] p-6">
                  <div className="h-4 w-32 rounded bg-white/8 animate-pulse" />
                  <div className="h-6 w-48 rounded bg-white/8 animate-pulse" />
                  <div className="h-4 w-full rounded bg-white/6 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-white/6 animate-pulse" />
                </div>
                <div className="lg:col-span-7 space-y-4 rounded-2xl border border-white/8 bg-[#12141A] p-6">
                  <div className="h-5 w-52 rounded bg-white/8 animate-pulse" />
                  <div className="h-4 w-full rounded bg-white/6 animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-white/6 animate-pulse" />
                </div>
              </div>
            ) : error ? (
              <div className="mt-8 rounded-2xl border border-white/8 bg-[#12141A] p-8 text-center space-y-4">
                <p className="text-base font-semibold text-slate-100">
                  Release details could not be loaded
                </p>
                <p className="mx-auto max-w-md text-sm text-slate-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadRelease(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : release ? (
              <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Left: Structured Build Spec Table */}
                <div className="lg:col-span-5 rounded-2xl border border-white/8 bg-[#12141A] p-6 flex flex-col justify-between gap-6">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
                      <div>
                        <p className="text-xs font-medium text-slate-400">Release Name</p>
                        <p className="mt-1 text-lg font-semibold text-slate-50">
                          {release.releaseName}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums text-amber-400">
                        {release.tagName}
                      </span>
                    </div>

                    <dl className="space-y-3.5 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">Latest version</dt>
                        <dd className="font-mono font-medium tabular-nums text-slate-100">
                          {release.tagName}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">Release date</dt>
                        <dd className="font-mono font-medium tabular-nums text-slate-100">
                          {formatReleaseDate(release.publishedAt)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">APK file</dt>
                        <dd className="font-mono font-medium text-slate-100 truncate max-w-[210px]">
                          {release.apk ? release.apk.name : 'Not attached'}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">APK size</dt>
                        <dd className="font-mono font-medium tabular-nums text-slate-100">
                          {release.apk ? formatFileSize(release.apk.size) : 'Unavailable'}
                        </dd>
                      </div>
                      {release.apk && release.apk.downloadCount > 0 && (
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-slate-400">GitHub downloads</dt>
                          <dd className="font-mono font-medium tabular-nums text-slate-100">
                            {release.apk.downloadCount.toLocaleString()}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {release.apk?.digest && (
                      <div className="border-t border-white/8 pt-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                            SHA-256 Checksum
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleCopyDigest()}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 transition-colors hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1.5 py-0.5"
                          >
                            {copiedDigest ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                                <span className="text-emerald-300">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="break-all font-mono text-[11px] leading-relaxed text-slate-400">
                          {release.apk.digest.replace(/^sha256:/i, '')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Additional APK assets if a release publishes split ABIs */}
                  {release.allApkAssets.length > 1 && (
                    <div className="border-t border-white/8 pt-4 space-y-2">
                      <p className="text-xs font-medium text-slate-400">All APK files in release</p>
                      <ul className="space-y-1.5">
                        {release.allApkAssets.map((asset) => (
                          <li key={asset.name} className="flex items-center justify-between gap-3 text-xs">
                            <a
                              href={asset.downloadUrl}
                              download={asset.name}
                              rel="noopener noreferrer"
                              className="font-mono text-amber-400 hover:text-amber-300 underline decoration-amber-400/30 underline-offset-4 truncate"
                            >
                              {asset.name}
                            </a>
                            <span className="font-mono tabular-nums text-slate-400 shrink-0">
                              {formatFileSize(asset.size)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="border-t border-white/8 pt-4 flex items-center justify-between gap-4">
                    <a
                      href={release.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-amber-300 transition-colors"
                    >
                      <span>Inspect on GitHub Releases</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {/* Right: What's New in This Version */}
                <div className="lg:col-span-7 rounded-2xl border border-white/8 bg-[#12141A] p-6 lg:p-8 flex flex-col justify-between gap-6">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                      <h3 className="text-lg font-semibold tracking-tight text-slate-50">
                        What&apos;s new in this version
                      </h3>
                      <span className="font-mono text-xs tabular-nums text-slate-400">
                        {release.tagName} · {formatReleaseDate(release.publishedAt)}
                      </span>
                    </div>

                    <ReleaseNotes
                      body={release.body}
                      releaseName={release.releaseName}
                      tagName={release.tagName}
                      htmlUrl={release.htmlUrl}
                    />
                  </div>

                  {release.apk && (
                    <div className="border-t border-white/8 pt-5 flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs text-slate-400">
                        Direct binary served via GitHub Release assets.
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadApk}
                        disabled={downloadState === 'preparing'}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Download {release.tagName} APK</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Android Installation Guide */}
        <section id="install-guide" className="border-b border-white/8">
          <div className="mx-auto max-w-[1200px] px-6 py-14 lg:py-20">
            <div className="max-w-xl space-y-2 pb-10">
              <h2 className="text-2xl font-bold tracking-tight text-slate-50">
                Install on Android
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                Because Never Miss Alerts is distributed directly from GitHub, Android asks once to
                confirm installation from your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="border-t border-white/12 pt-5 space-y-2.5">
                <h3 className="text-base font-semibold text-slate-100">
                  01. Download the APK
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  Tap <span className="text-slate-200 font-medium">Download APK</span> above on your
                  Android phone or transfer the downloaded file from your desktop.
                </p>
              </div>

              <div className="border-t border-white/12 pt-5 space-y-2.5">
                <h3 className="text-base font-semibold text-slate-100">
                  02. Allow browser installs
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  Open the downloaded <code className="font-mono text-xs text-amber-300">.apk</code>{' '}
                  file and enable <span className="text-slate-200 font-medium">Allow from this source</span>{' '}
                  in Android settings if prompted.
                </p>
              </div>

              <div className="border-t border-white/12 pt-5 space-y-2.5">
                <h3 className="text-base font-semibold text-slate-100">
                  03. Enable notifications
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  Launch Never Miss Alerts, grant notification permission, and schedule reminders
                  that stay reliable across reboots.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#08090C]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">Never Miss Alerts</p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Never Miss Alerts. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-slate-100"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href={`${GITHUB_REPO_URL}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-slate-100"
            >
              <span>All Releases</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
