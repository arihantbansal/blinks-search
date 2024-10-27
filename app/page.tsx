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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("newest");
	const [hasMore, setHasMore] = useState(true);

	const fetchRegistryData = useCallback(async () => {
		try {
			const res = await fetch("https://registry.dial.to/v1/list");
			if (!res.ok) {
				throw new Error(`Failed to fetch registry data: ${res.statusText}`);
			}
			const data = await res.json();
			const dataResults = data.results as ActionsRegistryData[];
			const filteredResults = dataResults.filter((res) =>
				res.tags.includes("registered")
			);
			console.log("Fetched registry data:", filteredResults.length);
			return filteredResults;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An unknown error occurred";
			console.error("Error fetching registry data:", errorMessage);
			setError(errorMessage);
			return [];
		}
	}, []);

	const sortActions = useCallback((actions: Action[], option: string) => {
		switch (option) {
			case "newest":
				return actions.sort((a, b) => {
					const aEntry = actionsRegistryData.find(
						(entry) => entry.actionUrl === a.url
					);
					const bEntry = actionsRegistryData.find(
						(entry) => entry.actionUrl === b.url
					);
					return (
						Number(bEntry?.createdAt ?? 0) - Number(aEntry?.createdAt ?? 0)
					);
				});
			case "oldest":
				return actions.sort((a, b) => {
					const aEntry = actionsRegistryData.find(
						(entry) => entry.actionUrl === a.url
					);
					const bEntry = actionsRegistryData.find(
						(entry) => entry.actionUrl === b.url
					);
					return (
						Number(aEntry?.createdAt ?? 0) - Number(bEntry?.createdAt ?? 0)
					);
				});
			case "nameAsc":
				return actions.sort((a, b) => a.title.localeCompare(b.title));
			case "nameDesc":
				return actions.sort((a, b) => b.title.localeCompare(a.title));
			default:
				return actions;
		}
	}, []);

	const fetchActions = useCallback(async () => {
		if (isLoading || actionsRegistryData.length === 0 || !hasMore) {
			console.log("Skipping fetchActions:", {
				isLoading,
				dataLength: actionsRegistryData.length,
				hasMore,
			});
			return;
		}

		setIsLoading(true);
		const start = page * BATCH_SIZE;
		const end = start + BATCH_SIZE;
		const batch = actionsRegistryData.slice(start, end);

		console.log("Fetching actions:", { start, end, batchSize: batch.length });

		if (batch.length === 0) {
			setHasMore(false);
			setIsLoading(false);
			console.log("No more actions to fetch");
			return;
		}

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

		console.log("Fetched valid actions:", validActions.length);

		const filteredActions = validActions.filter((action) =>
			action.title.toLowerCase().includes(searchQuery.toLowerCase())
		);

		const sortedActions = sortActions(filteredActions, sortOption);

		setActions((prevActions) => {
			const newActions = [...prevActions, ...sortedActions];
			console.log("Total actions after update:", newActions.length);
			return newActions;
		});
		setPage((prevPage) => prevPage + 1);
		setIsLoading(false);
	}, [
		page,
		actionsRegistryData,
		isLoading,
		searchQuery,
		sortOption,
		hasMore,
		sortActions,
	]);

	useEffect(() => {
		const loadInitialData = async () => {
			const registryData = await fetchRegistryData();
			setActionsRegistryData(registryData);
			setIsLoading(false);
		};

		loadInitialData();
	}, [fetchRegistryData]);

	useEffect(() => {
		if (actionsRegistryData.length > 0 && !isLoading) {
			setActions([]);
			setPage(0);
			setHasMore(true);
			fetchActions();
		}
	}, [actionsRegistryData, searchQuery, sortOption]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && !isLoading && hasMore) {
					console.log("Intersection observer triggered fetchActions");
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
	}, [isLoading, fetchActions, hasMore]);

	useEffect(() => {
		actions.forEach((action) => action.setAdapter(adapter));
	}, [actions, adapter]);

	const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
		setActions([]);
		setPage(0);
		setHasMore(true);
	}, []);

	const handleSort = useCallback((value: string) => {
		setSortOption(value);
		setActions([]);
		setPage(0);
		setHasMore(true);
	}, []);

	if (error) {
		return <div className="text-center">Error: {error}</div>;
	}

	return (
		<div className="relative">
			<div className="mb-4 flex flex-col sm:flex-row gap-4 sm:items-center">
				<Input
					type="search"
					placeholder="Search blinks..."
					value={searchQuery}
					onChange={handleSearch}
					className="flex-grow"
				/>
				<Select value={sortOption} onValueChange={handleSort}>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">Newest</SelectItem>
						<SelectItem value="oldest">Oldest</SelectItem>
						<SelectItem value="nameAsc">Name (A-Z)</SelectItem>
						<SelectItem value="nameDesc">Name (Z-A)</SelectItem>
					</SelectContent>
				</Select>
			</div>
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
			{hasMore && <div ref={loader} className="h-10 w-full" />}
		</div>
	);
};
