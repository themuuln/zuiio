import type { ReactNode } from "react";

export const metadata = {
  robots: "noindex",
};

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        header.sticky,
        footer,
        .group\\/scorebar { display: none !important; }
        #content { background: transparent !important; min-height: unset !important; }
      `,
        }}
      />
      {children}
    </>
  );
}
