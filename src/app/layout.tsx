import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const atkinson = localFont({
  src: [
    { path: "../../public/fonts/AtkinsonHyperlegible-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/AtkinsonHyperlegible-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "Festival Social Grid",
  description: "Grillas personales y grupales del festival",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${atkinson.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
