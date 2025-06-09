import fs from "fs-extra";
import path from "node:path";
import type { BPBuildOptions, BuildOptions } from "./build-options.js";
import { initialPackSync } from "./build-shared.js";

/** @internal */
export async function buildBp(packOpts: BPBuildOptions, opts: BuildOptions): Promise<void> {
	await initialPackSync(["**/*"], ["manifest.json", "scripts/**/*"], packOpts, opts);
}
