import { buildBp } from "./build-bp.js";
import type { BuildOptions } from "./build-options.js";
import { buildRp } from "./build-rp.js";

export async function build(options: BuildOptions): Promise<void> {
	const buildPackPromises: Promise<void>[] = [];

	if (options.bp) {
		buildPackPromises.push(buildBp(options.bp, options));
	}

	if (options.rp) {
		buildPackPromises.push(buildRp(options.rp, options));
	}

	await Promise.allSettled(buildPackPromises);
}
