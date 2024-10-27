"use client";

import dynamic from "next/dynamic";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import {
	ConnectionProvider,
	WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ReactNode, useCallback, useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";

require("@solana/wallet-adapter-react-ui/styles.css");

export const WalletButton = dynamic(
	async () =>
		(await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
	{
		ssr: false,
	}
);

export function SolanaProvider({ children }: { children: ReactNode }) {
	const cluster = WalletAdapterNetwork.Mainnet;
	const endpoint = useMemo(
		() =>
			process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(cluster),
		[cluster]
	);
	const onError = useCallback((error: WalletError) => {
		console.error(error);
	}, []);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={[]} onError={onError} autoConnect={true}>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
