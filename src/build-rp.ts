import chalk from "chalk";
import chokidar from "chokidar";
import fs from "fs-extra";
import path from "node:path";
import type { BuildOptions, RPBuildOptions } from "./build-options.js";
import {
	addBasicPackSyncWatcherEventListeners,
	createBasePackSyncWatcherOpts,
	generatePackManifestJson,
	initialPackSync,
} from "./build-shared.js";
import { debounce, dimmedTimeString, waitForCondition } from "./utils.js";
import { minimatch } from "minimatch";

/** @internal */
export async function buildRp(packOpts: RPBuildOptions, opts: BuildOptions): Promise<void> {
	const includePatterns = packOpts.include ?? ["**/*"];

	const excludePatterns = [
		"manifest.json", // manifest.json will be generated
		...(packOpts.exclude ?? []),
	];

	if (packOpts.generateTextureList) excludePatterns.push("textures/texture_list.json");

	const { initialSrcEntries } = await initialPackSync(includePatterns, excludePatterns, packOpts, opts);

	await generatePackManifestJson(packOpts);

	const texListEntries: string[] = [];

	if (packOpts.generateTextureList) {
		for (const texFilePath of initialSrcEntries.filter((x) => minimatch(x, "textures/**/*.png"))) {
			texListEntries.push(texFilePath.slice(0, -4));
		}
	}

	const generateTexListFile = async () => {
		const contents = texListEntries.map((x) => x.replaceAll("\\", "/"));
		const json = JSON.stringify(contents, null, 2);
		const destPath = path.join(packOpts.outDir, "textures/texture_list.json");

		await fs.outputFile(destPath, json, { encoding: "utf8" });

		console.log(dimmedTimeString(), `(Re-)Generated texture_list.json at ${destPath.replaceAll("\\", "/")}`);
	};

	const generateTexListFileDebounced = debounce(generateTexListFile, 500);

	await generateTexListFile();

	if (!opts.watch) return;

	const watcher = chokidar.watch(".", createBasePackSyncWatcherOpts(includePatterns, excludePatterns, packOpts));
	addBasicPackSyncWatcherEventListeners(watcher, packOpts);

	// update texture_list.json
	watcher.on("all", (event, filePath) => {
		if (event !== "add" && event !== "unlink") return;
		if (!minimatch(filePath, "textures/**/*.png")) return;

		const texFilePath = filePath.slice(0, -4);

		if (event === "unlink") {
			const index = texListEntries.findIndex((x) => path.resolve(x) === path.resolve(texFilePath));
			texListEntries.splice(index, 1);
		} else {
			texListEntries.push(texFilePath);
		}

		generateTexListFileDebounced();
	});

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
