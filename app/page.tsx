"use client";

import React from "react";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";
import { clusterApiUrl } from "@solana/web3.js";
import BlinksMapper from "@/components/BlinksMapper";
import { WalletButton } from "@/components/solana-provider";
import "@dialectlabs/blinks/index.css";

export default function Home() {
	const { adapter } = useActionSolanaWalletAdapter(
		process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta")
	);

	return (
		<div className="min-h-screen bg-gray-100">
			<header className="bg-white shadow">
				<div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
					<h1 className="text-3xl font-bold text-gray-900">🔍 Search Blinks</h1>
					<WalletButton />
				</div>
			</header>
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<BlinksMapper adapter={adapter} />
				</div>
			</main>
		</div>
	);
}
