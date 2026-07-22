"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      className="mb-4 mt-10 scroll-m-20 text-3xl font-black tracking-tight text-foreground first:mt-0"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="mb-3 mt-8 scroll-m-20 text-2xl font-bold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mb-2 mt-6 scroll-m-20 text-xl font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="mb-2 mt-4 scroll-m-20 text-lg font-semibold tracking-tight text-foreground"
      {...props}
    >
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-4 leading-relaxed text-muted-foreground" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 list-disc pl-6 text-muted-foreground" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 list-decimal pl-6 text-muted-foreground" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mb-1 leading-relaxed" {...props}>
      {children}
    </li>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="font-medium text-[var(--brand-sports)] underline underline-offset-2 decoration-1 decoration-[var(--brand-sports)]/30 hover:decoration-[var(--brand-sports)] transition-all"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="rounded-md bg-accent/50 px-1.5 py-0.5 text-sm font-medium text-accent-foreground"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="mb-4 overflow-x-auto rounded-lg border bg-muted/50 p-4 text-sm">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children, ...props }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border">
      <table
        className="w-full border-collapse text-sm text-muted-foreground"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50 text-foreground" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border last:border-0" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="mb-4 border-l-4 border-[var(--brand-sports)] bg-accent/20 pl-4 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-8 border-border" {...props} />,
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-foreground/80" {...props}>
      {children}
    </em>
  ),
};

export function Markdown({ content }: { content: string }) {
  return (
    <article className="min-w-0">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
