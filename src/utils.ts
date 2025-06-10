import chalk from "chalk";
import fs from "fs-extra";
import { homedir } from "node:os";
import path from "node:path";

/** @internal */
export function getPackageVersion(): string {
	const fallbackVersion = "0.0.1";

	try {
		const packageJsonPath = path.resolve(import.meta.dirname, "../package.json");

		if (fs.existsSync(packageJsonPath)) {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
			return packageJson.version ?? fallbackVersion;
		}
	} catch (error) {
		console.error("Error reading package.json:", error);
	}

	return fallbackVersion;
}

/** @internal */
export function dirExists(dirpath: string): boolean {
	try {
		return fs.statSync(dirpath).isDirectory();
	} catch {
		return false;
	}
}

/** @internal */
export function isFileUrl(urlString: string) {
	try {
		const url = new URL(urlString);
		return url.protocol === "file:";
	} catch (e) {
		return false; // Not a valid URL at all, so not a file URL
	}
}

/** @internal */
export function getComMojangDir(beta?: boolean): string {
	return path.join(
		homedir(),
		"AppData/Local/Packages",
		beta ? "Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe" : "Microsoft.MinecraftUWP_8wekyb3d8bbwe",
		"LocalState/games/com.mojang",
	);
}

/** @internal */
export function getCurrentTimeString(): string {
	const now = new Date();

	const hours = now.getHours().toString().padStart(2, "0");
	const minutes = now.getMinutes().toString().padStart(2, "0");
	const seconds = now.getSeconds().toString().padStart(2, "0");
	const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

	const formattedTime = `[${hours}:${minutes}:${seconds}.${milliseconds}]`;

	return formattedTime;
}

/** @internal */
export function dimmedTimeString(): string {
	return chalk.dim(getCurrentTimeString());
}

/** @internal */
export function waitForCondition(conditionFn: () => boolean, interval = 100): Promise<void> {
	return new Promise((resolve) => {
		const timeout = setInterval(() => {
			if (!conditionFn()) return;
			clearTimeout(timeout);
			resolve();
		}, interval);
	});
}

/** @internal */
export function debounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout | null = null;

	return (...args: Parameters<T>) => {
		// Clear the previous timeout if it exists
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		// Set a new timeout
		timeoutId = setTimeout(() => {
			callback(...args);
		}, delay);
	};
}

/** @internal */
export function isObject(item: unknown): item is Record<string, any> {
	return (item && typeof item === "object" && !Array.isArray(item) && item !== null) === true;
}

/** @internal */
export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(target: T, source: U): T & U {
	const result = { ...target } as T & U;

	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			const sourceValue = source[key];
			const targetValue = result[key as keyof T];

			if (isObject(targetValue) && isObject(sourceValue)) {
				// Recursively merge nested objects
				(result as any)[key] = deepMerge(targetValue, sourceValue);
			} else {
				// Source value overwrites target value
				(result as any)[key] = sourceValue;
			}
		}
	}

	return result;
}
