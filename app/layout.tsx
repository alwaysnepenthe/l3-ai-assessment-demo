import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "L3 声光电基础 AI 语音测评",
  description: "医美军校 L3 声光电基础 AI 智能陪练 Demo",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="preload"
          href="/fonts/InterVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/fonts/misans/MiSansVF.min.css" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
