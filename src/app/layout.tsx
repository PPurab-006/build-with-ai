import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adaptive Execution Planner",
  description: "Deterministic goal-to-execution planner with honest adaptive replanning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className={`${inter.className} min-h-full flex flex-col text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
