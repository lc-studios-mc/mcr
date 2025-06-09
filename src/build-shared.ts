import fs from "fs-extra";
import { glob } from "glob";
import path from "node:path";
import type { BPBuildOptions, BuildOptions, RPBuildOptions } from "./build-options.js";
import { getCurrentTimeString } from "./utils.js";
import chalk from "chalk";

/** @internal */
export async function initialPackSync(
	include: string[],
	exclude: string[],
	packOpts: BPBuildOptions | RPBuildOptions,
	opts: BuildOptions,
): Promise<void> {
	await fs.ensureDir(packOpts.outDir);

	const globInclude = [...include, ...(packOpts.include ?? [])];
	const globExclude = [...exclude, ...(packOpts.exclude ?? [])];

	const initialSrcEntries = await glob(globInclude, {
		cwd: packOpts.srcDir,
		ignore: globExclude,
	});

	const initialOutEntries = await glob(globInclude, {
		cwd: packOpts.outDir,
		ignore: globExclude,
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
}
