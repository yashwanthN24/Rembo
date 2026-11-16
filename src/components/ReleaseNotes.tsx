import React from 'react';

interface ReleaseNotesProps {
  body: string;
  releaseName: string;
  tagName: string;
  htmlUrl: string;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[0.85em] text-amber-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function ReleaseNotes({ body, releaseName, tagName, htmlUrl }: ReleaseNotesProps) {
  const trimmed = body.trim();

  if (!trimmed) {
    return (
      <div className="space-y-3">
        <p className="text-[15px] leading-relaxed text-slate-300">
          Release <span className="font-mono text-slate-100">{tagName}</span> ({releaseName}) is
          published and ready for Android installation. No detailed changelog notes were attached to
          this release on GitHub.
        </p>
        <p className="text-sm text-slate-400">
          You can inspect commits and source changes directly on{' '}
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 underline decoration-amber-400/40 underline-offset-4 transition-colors hover:text-amber-300"
          >
            the GitHub release page
          </a>
          .
        </p>
      </div>
    );
  }

  const lines = trimmed.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`${keyPrefix}-list`} className="space-y-2.5 pl-5 text-[15px] leading-relaxed text-slate-300 list-disc marker:text-amber-400/80">
        {listItems.map((item, idx) => (
          <li key={idx}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushList(`empty-${index}`);
      return;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList(`heading-${index}`);
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      blocks.push(
        <h4
          key={`h-${index}`}
          className={
            level === 1
              ? 'pt-2 text-lg font-semibold tracking-tight text-slate-100'
              : 'pt-2 text-base font-semibold tracking-tight text-slate-100'
          }
        >
          {renderInlineMarkdown(content)}
        </h4>
      );
      return;
    }

    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList(`para-${index}`);
    blocks.push(
      <p key={`p-${index}`} className="text-[15px] leading-relaxed text-slate-300">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList('end');

  return <div className="space-y-4">{blocks}</div>;
}
