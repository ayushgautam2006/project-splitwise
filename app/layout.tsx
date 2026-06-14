import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SplitWise — Split Expenses Instantly",
  description:
    "Free expense splitting calculator. Add your group, log shared expenses, and instantly see who owes whom. No login required, no data stored.",
  keywords: ["expense splitting", "bill sharing", "group expenses", "settle debts", "splitwise calculator", "split bills"],
  openGraph: {
    title: "SplitWise — Split Expenses Instantly",
    description: "Free expense splitting calculator. No login required.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
