import { ExtendedActionGetResponse } from "@dialectlabs/blinks";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ActionsRegistryData = {
  actionUrl: string;
  blinkUrl: string;
  websiteUrl: string;
  createdAt: string;
  tags: string[];
  // icon: string;
  // /** describes the source of the action request */
  // title: string;
  // /** brief summary of the action to be performed */
  // description: string;
  // /** button text rendered to the user */
  // label: string;
  // /** UI state for the button being rendered to the user */
  // disabled?: boolean;
  // links?: {
  //   /** list of related Actions a user could perform */
  //   actions: {
  //     /** Type of action to be performed by user */
  //     type: "transaction" | "message" | "post" | "external-link";
  //     /** URL endpoint for an action */
  //     href: string;
  //     /** button text rendered to the user */
  //     label: string;
  //     /**
  //      * Parameters used to accept user input within an action}
  //      */
  //     parameters?: Array<TypedActionParameter>;
  //   };
  // };
  // /** non-fatal error message to be displayed to the user */
  // error?: ActionError;
};

export type BlinksDataType = ExtendedActionGetResponse & {
  metadata: ActionMetadata;
} & ActionsRegistryData;

export async function fetchAction(
  apiUrl: string,
): Promise<ExtendedActionGetResponse & { metadata: ActionMetadata }> {
  const proxyUrl = proxify(apiUrl);
  const response = await fetchWithTimeout(proxyUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch action ${proxyUrl}, action url: ${apiUrl}`,
    );
  }

  const data = (await response.json()) as ExtendedActionGetResponse;
  const metadata = getActionMetadata(response);

  return {
    ...data,
    metadata,
  };
}

export async function fetchWithTimeout(
  url: URL,
  options: { timeout?: number; headers?: HeadersInit } = {},
) {
  const { timeout = 8000, headers = {} } = options; // Default timeout of 8 seconds
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout); // Abort after the specified timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error; // Re-throw other errors
  } finally {
    clearTimeout(id); // Clear the timeout if the request completes
  }
}

export function proxify(url: string): URL {
  const baseUrl = new URL(url);
  if (shouldIgnoreProxy(baseUrl)) {
    return baseUrl;
  }
  const proxifiedUrl = new URL(proxyUrl!);
  proxifiedUrl.searchParams.set("url", url);
  return proxifiedUrl;
}

let proxyUrl: string | null = null;
// "https://proxy.dial.to";

function shouldIgnoreProxy(url: URL): boolean {
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return true;
  }
  if (!proxyUrl) {
    return true;
  }
  return false;
}

interface ActionMetadata {
  blockchainIds?: string[];
  version?: string;
}

const getActionMetadata = (response: Response): ActionMetadata => {
  const blockchainIds = response.headers
    .get("x-blockchain-ids")
    ?.split(",")
    .map((id) => id.trim());
  const version = response.headers.get("x-action-version")?.trim();

  return {
    blockchainIds,
    version,
  };
};
