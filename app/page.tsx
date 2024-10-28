"use client";

import "@dialectlabs/blinks/index.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	type Action,
	Blink,
	type ActionAdapter,
} from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";
import { clusterApiUrl } from "@solana/web3.js";
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
import blinksData from "@/blinks-data.json";
import { BlinksDataType } from "../lib/utils";

const DISPLAY_BATCH_SIZE = 24;

export default function App() {
	const { adapter } = useActionSolanaWalletAdapter(
		process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta")
	);

	return (
		<div className="min-h-screen bg-gray-200 text-gray-950">
			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold mb-8 text-center">
					🔍 search blinks
				</h1>
				<BlinkSearch adapter={adapter} />
			</main>
		</div>
	);
}

const BlinkSearch = ({ adapter }: { adapter: ActionAdapter }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [allActions, setAllActions] = useState<BlinksDataType[]>([]);
	const [displayedActions, setDisplayedActions] = useState<Action[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("newest");
	const loader = useRef(null);

	const loadActionsFromFile = useCallback(async () => {
		try {
			console.log("Loaded actions:", blinksData);
			return blinksData;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An unknown error occurred";
			console.error("Error loading actions:", errorMessage);
			setError(errorMessage);
			return [];
		}
	}, []);

	const sortActions = useCallback((actions: Action[], option: string) => {
		switch (option) {
			case "newest":
				return [...actions]; // File order is newest first
			case "oldest":
				return [...actions].reverse();
			case "nameAsc":
				return [...actions].sort((a, b) => a.title.localeCompare(b.title));
			case "nameDesc":
				return [...actions].sort((a, b) => b.title.localeCompare(a.title));
			default:
				return actions;
		}
	}, []);

	const filterAndSortActions = useCallback(
		(actions: Action[], query: string, sort: string) => {
			const filtered = actions.filter((action) =>
				(action.title?.toLowerCase() ?? "").includes(query.toLowerCase())
			);
			return sortActions(filtered, sort);
		},
		[sortActions]
	);

	const loadMoreActions = useCallback(() => {
		setDisplayedActions((prev) => {
			const filteredAndSorted = filterAndSortActions(
				allActions,
				searchQuery,
				sortOption
			);
			const nextBatch = filteredAndSorted.slice(
				prev.length,
				prev.length + DISPLAY_BATCH_SIZE
			);
			return [...prev, ...nextBatch];
		});
	}, [allActions, searchQuery, sortOption, filterAndSortActions]);

	useEffect(() => {
		const loadAllActions = async () => {
			setIsLoading(true);
			const actions = await loadActionsFromFile();
			setAllActions(actions);
			setIsLoading(false);
		};

		loadAllActions();
	}, [loadActionsFromFile]);

	useEffect(() => {
		setDisplayedActions([]);
		loadMoreActions();
	}, [allActions, searchQuery, sortOption, loadMoreActions]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && !isLoading) {
					loadMoreActions();
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
	}, [isLoading, loadMoreActions]);

	useEffect(() => {
		displayedActions.forEach((action) => action.setAdapter(adapter));
	}, [displayedActions, adapter]);

	const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	}, []);

	const handleSort = useCallback((value: string) => {
		setSortOption(value);
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
				{displayedActions.map((action) => (
					<div
						key={action.url}
						className="bg-white rounded-lg shadow-md overflow-hidden">
						<Blink action={action} websiteText={new URL(action.url).hostname} />
					</div>
				))}
				{isLoading &&
					Array.from({ length: DISPLAY_BATCH_SIZE }).map((_, index) => (
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
