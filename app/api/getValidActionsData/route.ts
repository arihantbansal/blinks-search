import { NextRequest } from "next/server";
import { ActionsRegistryData, fetchAction } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch("https://registry.dial.to/v1/list");
    if (!res.ok) {
      throw new Error(`Failed to fetch registry data: ${res.statusText}`);
    }
    const data = await res.json();

    const registeredActions = (data.results as ActionsRegistryData[]).filter(
      (res) => res.tags.includes("registered"),
    );

    console.log(`Total registered actions: ${registeredActions.length}`);

    // Filter actions based on actionUrl and icon before fetching
    const validRegisteredActions = await Promise.all(
      registeredActions.map(async (actionRegistryEntry) => {
        if (!actionRegistryEntry.actionUrl) {
          console.log(`Skipping action: Missing actionUrl`);
          return null;
        }

        try {
          const actionRes = await fetch(actionRegistryEntry.actionUrl);
          if (!actionRes.ok) {
            console.error(
              `Invalid action URL: ${actionRegistryEntry.actionUrl}, Status: ${actionRes.status} ${actionRes.statusText}`,
            );
            return null;
          }
          return actionRegistryEntry;
        } catch (error) {
          console.error(
            `Error checking action URL: ${actionRegistryEntry.actionUrl}`,
            error,
          );
          return null;
        }
      }),
    );

    console.log(
      `Valid registered actions: ${validRegisteredActions.filter(Boolean).length}`,
    );

    // Filter out null values to ensure filteredActions is non-null
    const filteredActions: ActionsRegistryData[] =
      validRegisteredActions.filter(
        (action): action is ActionsRegistryData => action !== null,
      );

    console.log(`Filtered actions: ${filteredActions.length}`);

    // Process actions in batches of 5 to avoid rate limits
    const batchSize = 5;
    const fetchedActions = [];

    for (let i = 0; i < filteredActions.length; i += batchSize) {
      const batch = filteredActions.slice(i, i + batchSize);
      const batchPromises = batch.map((actionRegistryEntry) =>
        fetchAction(actionRegistryEntry.actionUrl)
          .then((actionData) => {
            console.log(actionData);

            if (!actionData.icon || !actionData.disabled) {
              console.log(
                `Skipping action: Missing icon or disabled, actionUrl: ${actionRegistryEntry.actionUrl}`,
              );
              return null;
            }

            return {
              ...actionRegistryEntry,
              ...actionData,
            };
          })
          .catch((error) => {
            console.error(
              `Failed to fetch action from ${actionRegistryEntry.actionUrl}:`,
              error,
            );
            return null;
          }),
      );

      const batchResults = await Promise.all(batchPromises);
      fetchedActions.push(...batchResults.filter(Boolean));

      // Add delay between batches to further reduce load
      if (i + batchSize < filteredActions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Fetched actions: ${fetchedActions.length}`);

    return new Response(JSON.stringify(fetchedActions), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in GET request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export const dynamic = "force-dynamic";
