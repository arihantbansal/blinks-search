import { NextRequest } from "next/server";
import { ActionsRegistryData, fetchAction } from "@/lib/utils";

export async function GET(request: NextRequest) {
	const res = await fetch("https://registry.dial.to/v1/list");
	if (!res.ok) {
		throw new Error(`Failed to fetch registry data: ${res.statusText}`);
	}
	const data = await res.json();

	const registeredActions = (data.results as ActionsRegistryData[]).filter(
		(res) => res.tags.includes("registered")
	);

	// Process actions in batches of 5 to avoid rate limits
	const batchSize = 5;
	const fetchedActions = [];
	
	for (let i = 0; i < registeredActions.length; i += batchSize) {
		const batch = registeredActions.slice(i, i + batchSize);
		const batchPromises = batch.map((actionRegistryEntry) =>
			fetchAction(actionRegistryEntry.actionUrl)
				.then((actionData) => ({
					...actionRegistryEntry,
					...actionData
				}))
				.catch((error) => {
					console.error(
						`Failed to fetch action from ${actionRegistryEntry.actionUrl}:`,
						error
					);
					return null;
				})
		);
		
		const batchResults = await Promise.all(batchPromises);
		fetchedActions.push(...batchResults);
		
		// Add delay between batches to further reduce load
		if (i + batchSize < registeredActions.length) {
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
	}
	const validActions = fetchedActions.filter(Boolean);

	return new Response(JSON.stringify(validActions), {
		headers: {
			"Content-Type": "application/json",
		},
	});
}

export const dynamic = "force-dynamic";
// 'auto' | 'force-dynamic' | 'error' | 'force-static'