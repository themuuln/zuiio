"use client";

import { Fragment, type ReactNode, useMemo } from "react";

/**
 * Minimal Markdown renderer for the storefront AI chat replies.
 *
 * The AI assistant formats answers with a small Markdown subset
 * (`**bold**`, `*italic*`, `` `code` ``, `-` bullets, `1.` lists,
 * `[text](url)` links and bare URLs). The widget previously rendered the
 * raw text, so the syntax characters (`**`, `1.`, `-`) showed literally.
 *
 * Safety: output is built from React elements only — never
 * dangerouslySetInnerHTML — so model-generated HTML/script is escaped by
 * React. Only `http(s)` links are clickable; `javascript:` and other
 * schemes render as plain text.
 */
const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g;
const SAFE_URL = /^https?:\/\//i;

// Inline tokens, in priority order: code, bold, italic, markdown link.
const INLINE_TOKEN_RE =
  /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/g;

const HEADING_RE = /^(#{1,3})\s+(.+)$/;
const UL_ITEM_RE = /^[-•]\s+(.+)$/;
const OL_ITEM_RE = /^\d+[.)]\s+(.+)$/;
const CONTINUATION_RE = /^\s{2,}\S/;

type List = { kind: "ul" | "ol"; items: ReactNode[][] };

export function MarkdownText({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  return <div className="space-y-2">{blocks}</div>;
}

/** Splits a line into inline React nodes (bold/italic/code/links/URLs). */
function renderInline(line: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const parts = line.split(INLINE_TOKEN_RE);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const key = `${keyBase}-${i}`;

    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(<code key={key}>{part.slice(1, -1)}</code>);
    } else if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(
        <strong key={key}>{renderInline(part.slice(2, -2), key)}</strong>,
      );
    } else if (part.startsWith("*") && part.endsWith("*")) {
      nodes.push(<em key={key}>{renderInline(part.slice(1, -1), key)}</em>);
    } else if (part.startsWith("[") && part.endsWith(")")) {
      const match = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (match && SAFE_URL.test(match[2])) {
        nodes.push(
          <a
            key={key}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {renderInline(match[1], key)}
          </a>,
        );
      } else {
        // Unsupported or unsafe link target — show the raw text.
        nodes.push(<span key={key}>{part}</span>);
      }
    } else {
      // Plain text segment — split out bare http(s) URLs.
      const subParts = part.split(URL_PATTERN);
      for (let j = 0; j < subParts.length; j++) {
        const sub = subParts[j];
        if (!sub) continue;
        if (SAFE_URL.test(sub)) {
          nodes.push(
            <a
              key={`${key}-u${j}`}
              href={sub}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {sub}
            </a>,
          );
        } else {
          nodes.push(sub);
        }
      }
    }
  }
  return nodes;
}

/** Parses the whole reply into block-level React nodes. */
function parseBlocks(text: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let list: List | null = null;
  let para: string[] = [];
  let seq = 0;
  const nextKey = () => `md-${seq++}`;

  const flushList = () => {
    if (!list) return;
    const { kind, items } = list;
    const ListTag = kind === "ul" ? "ul" : "ol";
    const className =
      kind === "ul"
        ? "list-disc space-y-1 pl-4"
        : "list-decimal space-y-1 pl-4";
    blocks.push(
      <ListTag key={nextKey()} className={className}>
        {items.map((itemLines, i) => (
          <li key={i} className="leading-relaxed">
            {itemLines.map((lineNodes, j) => (
              <Fragment key={j}>
                {j > 0 ? (
                  <>
                    <br />
                    {lineNodes}
                  </>
                ) : (
                  lineNodes
                )}
              </Fragment>
            ))}
          </li>
        ))}
      </ListTag>,
    );
    list = null;
  };

  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push(
      <p key={nextKey()} className="leading-relaxed">
        {renderInline(para.join(" "), nextKey())}
      </p>,
    );
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }

    const heading = trimmed.match(HEADING_RE);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      blocks.push(
        <Tag key={nextKey()} className="font-semibold">
          {renderInline(heading[2], nextKey())}
        </Tag>,
      );
      continue;
    }

    const ulItem = trimmed.match(UL_ITEM_RE);
    if (ulItem) {
      flushPara();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push([renderInline(ulItem[1], nextKey())]);
      continue;
    }

    const olItem = trimmed.match(OL_ITEM_RE);
    if (olItem) {
      flushPara();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push([renderInline(olItem[1], nextKey())]);
      continue;
    }

    // Indented continuation line — belongs to the current list item.
    if (list && CONTINUATION_RE.test(line)) {
      const last = list.items[list.items.length - 1];
      last.push(renderInline(trimmed, nextKey()));
      continue;
    }

    // Ordinary paragraph line (markdown soft-wrapped paragraphs merge).
    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return blocks;
}
