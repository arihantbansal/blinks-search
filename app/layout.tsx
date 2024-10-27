import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { SolanaProvider } from "../components/solana-provider";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "🔍 search blinks",
	description: "Search through all blinks in the Dialect Blink Registry",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
				<SolanaProvider>{children}</SolanaProvider>
			</body>
		</html>
	);
}
