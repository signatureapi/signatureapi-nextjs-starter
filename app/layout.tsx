import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Send an agreement · SignatureAPI example",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* Plain CSS served from public/ at /app.css, the same file every SignatureAPI starter uses. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/app.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
