import chalk from "chalk";
import chokidar from "chokidar";
import type { BPBuildOptions, BuildOptions } from "./build-options.js";
import {
	addBasicPackSyncWatcherEventListeners,
	createBasePackSyncWatcherOpts,
	generatePackManifestJson,
	initialPackSync,
} from "./build-shared.js";
import { dimmedTimeString, waitForCondition } from "./utils.js";

/** @internal */
export async function buildBp(packOpts: BPBuildOptions, opts: BuildOptions): Promise<void> {
	const includePatterns = packOpts.include ?? ["**/*"];

	const excludePatterns = [
		"manifest.json", // manifest.json will be generated
		"scripts/**/*",
		...(packOpts.exclude ?? []),
	];

	await initialPackSync(includePatterns, excludePatterns, packOpts, opts);

	await generatePackManifestJson(packOpts);

	if (!(packOpts.watch ?? opts.watch)) return;

	const watcher = chokidar.watch(".", createBasePackSyncWatcherOpts(includePatterns, excludePatterns, packOpts));
	addBasicPackSyncWatcherEventListeners(watcher, packOpts);

	process.once("SIGINT", async () => {
		await watcher.close();
		console.log(dimmedTimeString(), chalk.cyan(`Closed the watcher for ${packOpts.srcDir}`));
	});

	console.log(
		dimmedTimeString(),
		chalk.cyan(`Watching for file changes in ${packOpts.srcDir}...`, chalk.underline("(Press CTRL+c to stop)")),
	);

	await waitForCondition(() => watcher.closed);
}
