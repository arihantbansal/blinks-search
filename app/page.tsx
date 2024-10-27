"use client";

import "@dialectlabs/blinks/index.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	Action,
	Blink,
	type ActionAdapter,
	useActionsRegistryInterval,
} from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";
import { clusterApiUrl } from "@solana/web3.js";
import { ActionsRegistryData } from "@/lib/utils";
import BlinkSkeleton from "@/components/BlinkSkeleton";
import MasonryGrid from "@/components/MasonryGrid";

const BATCH_SIZE = 12;

export default function App() {
	const { isRegistryLoaded } = useActionsRegistryInterval();
	const { adapter } = useActionSolanaWalletAdapter(
		process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta")
	);

	return (
		<div className="min-h-screen bg-gray-200 text-gray-950">
			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8 text-center">
					🔍 search blinks
				</h1>
				<InfiniteScrollActions adapter={adapter} />
			</main>
		</div>
	);
}

const InfiniteScrollActions = ({ adapter }: { adapter: ActionAdapter }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionsRegistryData, setActionsRegistryData] = useState<
		ActionsRegistryData[]
	>([]);
	const [actions, setActions] = useState<Action[]>([]);
	const [page, setPage] = useState(0);
	const loader = useRef(null);

	const fetchRegistryData = async () => {
		try {
			const res = await fetch("https://registry.dial.to/v1/list");
			if (!res.ok) {
				throw new Error(`Failed to fetch registry data: ${res.statusText}`);
			}
			const data = await res.json();
			const dataResults = data.results as ActionsRegistryData[];
			return dataResults.filter((res) => res.tags.includes("registered"));
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An unknown error occurred";
			console.error("Error fetching registry data:", errorMessage);
			setError(errorMessage);
			return [];
		}
	};

	const fetchActions = useCallback(async () => {
		if (isLoading || actionsRegistryData.length === 0) return;

		setIsLoading(true);
		const start = page * BATCH_SIZE;
		const end = start + BATCH_SIZE;
		const batch = actionsRegistryData.slice(start, end);

		const actionPromises = batch.map((actionRegistryEntry) =>
			Action.fetch(actionRegistryEntry.actionUrl).catch((error) => {
				console.error(
					`Failed to fetch action from ${actionRegistryEntry.actionUrl}:`,
					error
				);
				return null;
			})
		);

		const fetchedActions = await Promise.all(actionPromises);
		const validActions = fetchedActions.filter(Boolean) as Action[];

		setActions((prevActions) => [...prevActions, ...validActions]);
		setPage((prevPage) => prevPage + 1);
		setIsLoading(false);
	}, [page, actionsRegistryData, isLoading]);

	useEffect(() => {
		const loadInitialData = async () => {
			const registryData = await fetchRegistryData();
			setActionsRegistryData(registryData);
			setIsLoading(false);
		};

		loadInitialData();
	}, []);

	useEffect(() => {
		if (actionsRegistryData.length > 0) {
			fetchActions();
		}
	}, [actionsRegistryData, fetchActions]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && !isLoading) {
					fetchActions();
				}
			},
			{ threshold: 0.1 }
		);

		const currentLoader = loader.current;
		if (currentLoader) {
			observer.observe(currentLoader);
		}

		return () => {
			if (currentLoader) {
				observer.unobserve(currentLoader);
			}
		};
	}, [isLoading, fetchActions]);

	useEffect(() => {
		actions.forEach((action) => action.setAdapter(adapter));
	}, [actions, adapter]);

	if (error) {
		return <div className="text-center">Error: {error}</div>;
	}

	return (
		<div className="relative">
			<MasonryGrid>
				{actions.map((action) => (
					<div
						key={action.url}
						className="bg-white rounded-lg shadow-md overflow-hidden">
						<Blink action={action} websiteText={new URL(action.url).hostname} />
					</div>
				))}
				{isLoading &&
					Array.from({ length: BATCH_SIZE }).map((_, index) => (
						<div
							key={`skeleton-${index}`}
							className="bg-white rounded-lg shadow-md overflow-hidden">
							<BlinkSkeleton />
						</div>
					))}
			</MasonryGrid>
			<div ref={loader} className="h-10 w-full" />
		</div>
	);
};
