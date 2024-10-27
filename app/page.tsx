"use client";

import "@dialectlabs/blinks/index.css";
import { useState, useEffect, useRef, useCallback } from "react";
import {
	Action,
	Blink,
	type ActionAdapter,
	useActionsRegistryInterval,
} from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";
import { clusterApiUrl } from "@solana/web3.js";
import { ActionsRegistryData } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BlinkSkeleton from "@/components/BlinkSkeleton";

const BATCH_SIZE = 12; // Changed to 12 for better alignment in 3 columns

export default function App() {
	const { isRegistryLoaded } = useActionsRegistryInterval();
	const { adapter } = useActionSolanaWalletAdapter(
		process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta")
	);

	return (
		<div className="min-h-screen bg-gray-200 text-gray-950">
			<Navbar />
			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8 text-center">Search Blinks</h1>
				{isRegistryLoaded ? (
					<InfiniteScrollActions adapter={adapter} />
				) : (
					<div className="text-center">Loading actions registry...</div>
				)}
			</main>
		</div>
	);
}

const Navbar = () => {
	return (
		<nav className="bg-gray-800 py-4">
			<div className="container mx-auto px-4 flex justify-between items-center">
				<Button variant="ghost" className="text-gray-950">
					Menu
				</Button>
				<Button variant="ghost" className="text-gray-950">
					Profile
				</Button>
			</div>
		</nav>
	);
};


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
			return data.results as ActionsRegistryData[];
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
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{actions.map((action) => (
				<div key={action.url} className="bg-gray-800 rounded-lg p-4">
					<Blink action={action} websiteText={new URL(action.url).hostname} />
				</div>
			))}
			{isLoading &&
				Array.from({ length: BATCH_SIZE }).map((_, index) => (
					<BlinkSkeleton key={`skeleton-${index}`} />
				))}
			<div ref={loader} className="col-span-full h-10" />
		</div>
	);
};
