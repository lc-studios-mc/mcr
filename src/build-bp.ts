import chokidar from "chokidar";
import fs from "fs-extra";
import path from "node:path";
import type { BPBuildOptions, BuildOptions } from "./build-options.js";
import { initialPackSync } from "./build-shared.js";
import { getCurrentTimeString, waitForCondition } from "./utils.js";
import chalk from "chalk";
import { minimatch } from "minimatch";

/** @internal */
export async function buildBp(packOpts: BPBuildOptions, opts: BuildOptions): Promise<void> {
	const includePatterns = packOpts.include ?? ["**/*"];

	const excludePatterns = [
		"manifest.json", // manifest.json will be generated
		"scripts/**/*",
		...(packOpts.exclude ?? []),
	];

	await initialPackSync(includePatterns, excludePatterns, packOpts, opts);

	if (!(packOpts.watch ?? opts.watch)) return;

	const watcher = chokidar.watch(".", {
		cwd: packOpts.srcDir,
		persistent: true,
		awaitWriteFinish: {
			stabilityThreshold: 300,
			pollInterval: 100,
		},
		atomic: 100,
		ignoreInitial: true,
		ignored: (srcPath) => {
			if (path.resolve(srcPath) === path.resolve(packOpts.srcDir)) return false;

			const srcDirRelativePath = path.relative(packOpts.srcDir, srcPath);
			return (
				includePatterns.some((pattern) => minimatch(srcDirRelativePath, pattern)) &&
				!excludePatterns.some((pattern) => minimatch(srcDirRelativePath, pattern))
			);
		},
	});

	watcher.on("all", (event, filePath) => {
		console.log(chalk.dim(getCurrentTimeString()), `${event}:`, path.join(packOpts.srcDir, filePath));
	});

	process.once("SIGINT", async () => {
		await watcher.close();
	});

	await waitForCondition(() => watcher.closed);
}
