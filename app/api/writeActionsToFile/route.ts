import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
    try {
        // Call getAllActionsData endpoint
        const url = new URL("/api/getAllActionsData", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        const actionsResponse = await fetch(url);
        
        if (!actionsResponse.ok) {
            throw new Error(`Failed to fetch actions data: ${actionsResponse.statusText}`);
        }

        const actionsData = await actionsResponse.json();

        // Completely overwrite blinks-data.json in repo root
        const filePath = path.join(process.cwd(), "blinks.json");
        await fs.writeFile(filePath, JSON.stringify(actionsData, null, "\t"), {
            flag: 'w' // 'w' flag ensures file is overwritten completely
        });

        return new Response("Actions data written successfully", {
            status: 200
        });

    } catch (error) {
        console.error("Error writing actions data:", error);
        return new Response(
            `Failed to write actions data: ${error instanceof Error ? error.message : "Unknown error"}`,
            { status: 500 }
        );
    }
}

