import type { Metadata } from "next";
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
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
