import chalk from "chalk";
import type { ChokidarOptions, FSWatcher } from "chokidar";
import fs from "fs-extra";
import { glob } from "glob";
import { minimatch } from "minimatch";
import path from "node:path";
import type { BPBuildOptions, BuildOptions, RPBuildOptions } from "./build-options.js";
import { dimmedTimeString, getCurrentTimeString } from "./utils.js";

/** @internal */
export async function initialPackSync(
	include: string[],
	exclude: string[],
	packOpts: BPBuildOptions | RPBuildOptions,
	opts: BuildOptions,
): Promise<{ initialSrcEntries: string[]; initialOutEntries: string[] }> {
	await fs.ensureDir(packOpts.outDir);

	const initialSrcEntries = await glob(include, {
		cwd: packOpts.srcDir,
		ignore: exclude,
	});

	const initialOutEntries = await glob(include, {
		cwd: packOpts.outDir,
		ignore: exclude,
	});
	const orphanedOutEntries = initialOutEntries.filter((x) => !initialSrcEntries.includes(x));

	if (packOpts.removeOrphans ?? opts.removeOrphans) {
		for (const entry of orphanedOutEntries) {
			const outPath = path.join(packOpts.outDir, entry);
			await fs.rm(outPath, { force: true, recursive: true });
		}
	}

	for (const entry of initialSrcEntries) {
		const srcPath = path.join(packOpts.srcDir, entry);
		const srcStat = await fs.stat(srcPath);
		const outPath = path.join(packOpts.outDir, entry);

		if (srcStat.isDirectory()) {
			await fs.ensureDir(outPath);
			continue;
		}

		if (!srcStat.isFile()) continue;

		await fs.ensureDir(path.dirname(outPath));
		await fs.copyFile(srcPath, outPath);
	}

	console.log(chalk.gray(getCurrentTimeString()), `Initial file system sync of ${packOpts.srcDir} completed.`);

	return {
		initialSrcEntries,
		initialOutEntries,
	};
}

/** @internal */
export function createBasePackSyncWatcherOpts(
	include: string[],
	exclude: string[],
	packOpts: BPBuildOptions | RPBuildOptions,
): ChokidarOptions {
	return {
		cwd: packOpts.srcDir,
		persistent: true,
		awaitWriteFinish: {
			stabilityThreshold: 300,
			pollInterval: 100,
		},
		atomic: 100,
		ignoreInitial: true,
		ignored: (srcPath) => {
			if (path.resolve(srcPath) === path.resolve(packOpts.srcDir)) return false; // include the src dir itself

			const srcDirRelativePath = path.relative(packOpts.srcDir, srcPath);
			return (
				!include.some((pattern) => minimatch(srcDirRelativePath, pattern)) ||
				exclude.some((pattern) => minimatch(srcDirRelativePath, pattern))
			);
		},
	};
}

/** @internal */
export function addBasicPackSyncWatcherEventListeners(
	watcher: FSWatcher,
	packOpts: BPBuildOptions | RPBuildOptions,
): void {
	const joinToSrcDir = (srcRelPath: string) => path.join(packOpts.srcDir, srcRelPath);
	const joinToOutDir = (srcRelPath: string) => path.join(packOpts.outDir, srcRelPath);

	watcher.on("all", (event, relPath) => {
		if (event === "error") return;
		console.log(dimmedTimeString(), `${event}:`, joinToSrcDir(relPath));
	});

	const eventListenerCopyFile = async (relPath: string) => {
		const srcPath = joinToSrcDir(relPath);
		const destPath = joinToOutDir(relPath);
		await fs.ensureDir(path.dirname(destPath));
		await fs.copyFile(srcPath, destPath);
	};

	watcher.on("add", eventListenerCopyFile);
	watcher.on("change", eventListenerCopyFile);

	const eventListenerRm = async (relPath: string) => {
		const destPath = joinToOutDir(relPath);
		await fs.rm(destPath, { force: true, recursive: true });
	};

	watcher.on("unlink", eventListenerRm);
	watcher.on("unlinkDir", eventListenerRm);

	watcher.on("error", (err) => {
		console.error(dimmedTimeString(), chalk.red(`Error in the watcher for ${packOpts.srcDir}:`, err));
	});
}
