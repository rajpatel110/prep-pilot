import type { Metadata } from "next";
import Script from "next/script";
import { appConfig } from "@/config/app";
import { serverConfig } from "@/shared/server/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(serverConfig.APP_URL),
  title: appConfig.name,
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js?v=1" strategy="beforeInteractive" />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
