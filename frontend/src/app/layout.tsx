import type { Metadata } from "next";
import "./globals.css";
import { buildThemeCss } from "@/lib/theme";
import ThemeScript from "@/components/ThemeScript";
import TopAppBar from "@/components/TopAppBar";

export const metadata: Metadata = {
  title: "JWST MIRI Spectra Explorer",
  description:
    "Explore the JWST MIRI transmission-spectroscopy dataset used in the technosignature and " +
    "biosignature gas search, with a toggle between the NASA Exoplanet Archive and MAST sources.",
};

const themeCss = buildThemeCss();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fonts are linked here (not next/font) on purpose, so the production
            build needs no network access. The App Router head is the correct
            place for these links; the lint rule below targets the Pages Router. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeScript />
        <TopAppBar />
        {children}
      </body>
    </html>
  );
}
