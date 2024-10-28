"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Action, Blink, useActionsRegistryInterval } from "@dialectlabs/blinks";
import blinksData from "@/blinks-data.json";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import "@dialectlabs/blinks/index.css";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana";
import { clusterApiUrl } from "@solana/web3.js";
import BlinkSkeleton from "@/components/BlinkSkeleton";

interface ActionWithMetadata {
	action: Action;
	createdAt: Date;
	description: string;
}

export default function BlinksMapper() {
	const { isRegistryLoaded } = useActionsRegistryInterval();
	const { adapter } = useActionSolanaWalletAdapter(
		process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta")
	);
	const [allActions, setAllActions] = useState<ActionWithMetadata[]>([]);
	const [filteredActions, setFilteredActions] = useState<ActionWithMetadata[]>(
		[]
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("newest");

	const mapBlinksToActions = useCallback(async () => {
		try {
			const actions = await Promise.all(
				blinksData.map(async (blink) => {
					try {
						const action = await Action.fetch(blink.actionUrl);
						console.log("Fetched action:", action);
						return {
							action,
							createdAt: new Date(blink.createdAt),
							description: blink.description,
						};
					} catch (error) {
						console.error(
							`Failed to fetch action for ${blink.actionUrl}:`,
							error
						);
						return null;
					}
				})
			);

			return actions.filter(
				(item): item is ActionWithMetadata => item !== null
			);
		} catch (error) {
			console.error("Error mapping blinks to actions:", error);
			throw new Error("Failed to map blinks to actions");
		}
	}, []);

	useEffect(() => {
		const fetchActions = async () => {
			try {
				setIsLoading(true);
				const actions = await mapBlinksToActions();
				setAllActions(actions);
				setFilteredActions(actions);
			} catch (error) {
				setError("Failed to load actions");
			} finally {
				setIsLoading(false);
			}
		};

		fetchActions();
	}, [mapBlinksToActions]);

	useEffect(() => {
		allActions.forEach(({ action }) => action.setAdapter(adapter));
	}, [allActions, adapter]);

	const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	}, []);

	const handleSort = useCallback((value: string) => {
		setSortOption(value);
	}, []);

	useEffect(() => {
		const filtered = allActions.filter(
			(item) =>
				item.action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.description.toLowerCase().includes(searchQuery.toLowerCase())
		);

		const sorted = [...filtered].sort((a, b) => {
			switch (sortOption) {
				case "newest":
					return b.createdAt.getTime() - a.createdAt.getTime();
				case "oldest":
					return a.createdAt.getTime() - b.createdAt.getTime();
				case "titleAsc":
					return a.action.title.localeCompare(b.action.title);
				case "titleDesc":
					return b.action.title.localeCompare(a.action.title);
				default:
					return 0;
			}
		});

		setFilteredActions(sorted);
	}, [allActions, searchQuery, sortOption]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row gap-4">
				<Input
					type="search"
					placeholder="Search blinks..."
					value={searchQuery}
					onChange={handleSearch}
					className="flex-grow"
					disabled={isLoading}
				/>
				<Select
					value={sortOption}
					onValueChange={handleSort}
					disabled={isLoading}
				>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder="Sort by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="newest">Newest</SelectItem>
						<SelectItem value="oldest">Oldest</SelectItem>
						<SelectItem value="titleAsc">Title (A-Z)</SelectItem>
						<SelectItem value="titleDesc">Title (Z-A)</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{isLoading ? (
					Array.from({ length: 9 }).map((_, index) => (
						<BlinkSkeleton key={index} />
					))
				) : error ? (
					<div className="col-span-full text-center text-red-500">
						Error: {error}
					</div>
				) : filteredActions.length === 0 ? (
					<div className="col-span-full text-center text-gray-500">
						No blinks found matching your search.
					</div>
				) : (
					filteredActions.map(({ action }) => (
						<React.Fragment key={action.url}>
							<Blink
								action={action}
								websiteText={new URL(action.url).hostname}
							/>
						</React.Fragment>
					))
				)}
			</div>
		</div>
	);
}
