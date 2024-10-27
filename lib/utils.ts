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
};
