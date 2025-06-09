import fs from "fs-extra";
import path from "node:path";
import type { RPBuildOptions, BuildOptions } from "./build-options.js";
import { initialPackSync } from "./build-shared.js";

/** @internal */
export async function buildRp(packOpts: RPBuildOptions, opts: BuildOptions): Promise<void> {
	const includePatterns = ["**/*", ...(packOpts.include ?? [])];
	const excludePatterns = ["manifest.json", ...(packOpts.exclude ?? [])];
	await initialPackSync(includePatterns, excludePatterns, packOpts, opts);
}
