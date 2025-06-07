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

	let hours = now.getHours();
	const minutes = now.getMinutes().toString().padStart(2, "0");
	const seconds = now.getSeconds().toString().padStart(2, "0");
	const milliseconds = now.getMilliseconds().toString().padStart(3, "0");

	const period = hours >= 12 ? "PM" : "AM";

	hours = hours % 12;
	hours = hours === 0 ? 12 : hours; // Convert 0 to 12 for midnight

	const formattedTime = `[${hours}:${minutes}:${seconds}.${milliseconds} ${period}]`;

	return formattedTime;
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
