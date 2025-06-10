import chalk from "chalk";
import { buildBpScripts } from "./build-bp-scripts.js";
import { buildBp } from "./build-bp.js";
import { replaceComMojangInBuildOptions, type BuildOptions } from "./build-options.js";
import { buildRp } from "./build-rp.js";

export async function build(options: BuildOptions): Promise<void> {
	const buildPackPromises: Promise<void>[] = [];

	replaceComMojangInBuildOptions(options);

	if (options.bp) {
		buildPackPromises.push(buildBp(options.bp, options));

		if (options.bp.script) {
			buildPackPromises.push(buildBpScripts(options.bp, options));
		}
	}

	if (options.rp) {
		buildPackPromises.push(buildRp(options.rp, options));
	}

	await Promise.allSettled(buildPackPromises);

	if (!options.watch) {
		console.log(chalk.green("Build finished!"));
	}
}
