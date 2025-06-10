import { z } from "zod/v4";
import { getComMojangDir } from "./utils.js";
import path from "node:path";

const BasePackBuildOptions = z.object({
	srcDir: z.string(),
	outDir: z.string(),
	manifest: z.any(),
	include: z.array(z.string()).optional(),
	exclude: z.array(z.string()).optional(),
});

export const BPBuildOptionsSchema = z.object({
	...BasePackBuildOptions.shape,
	script: z
		.object({
			entryPointRelativeToSrcDir: z.string(),
			tsconfig: z.string().optional(),
			bundle: z.boolean().optional(),
			minify: z.boolean().optional(),
			external: z.array(z.string()).optional(),
			sourceMap: z.boolean().optional(),
			banner: z.record(z.string(), z.string()).optional(),
			footer: z.record(z.string(), z.string()).optional(),
		})
		.optional(),
});

export interface BPBuildOptions extends z.infer<typeof BPBuildOptionsSchema> {}

export const RPBuildOptionsSchema = z.object({
	...BasePackBuildOptions.shape,
	generateTextureList: z.boolean().optional(),
});

export interface RPBuildOptions extends z.infer<typeof RPBuildOptionsSchema> {}

export const BuildOptionsSchema = z.object({
	bp: BPBuildOptionsSchema.optional(),
	rp: RPBuildOptionsSchema.optional(),
	comMojangBeta: z.boolean().optional(),
	removeOrphans: z.boolean().optional(),
	watch: z.boolean().optional(),
});

export interface BuildOptions extends z.infer<typeof BuildOptionsSchema> {
	bp?: BPBuildOptions;
	rp?: RPBuildOptions;
}

/** @internal */
export function replaceComMojangInBuildOptions(options: BuildOptions): void {
	const comMojangDir = getComMojangDir(options.comMojangBeta);

	if (options.bp) {
		options.bp.srcDir = path.resolve(options.bp.srcDir.replaceAll("<com.mojang>", comMojangDir));
		options.bp.outDir = path.resolve(options.bp.outDir.replaceAll("<com.mojang>", comMojangDir));
	}

	if (options.rp) {
		options.rp.srcDir = path.resolve(options.rp.srcDir.replaceAll("<com.mojang>", comMojangDir));
		options.rp.outDir = path.resolve(options.rp.outDir.replaceAll("<com.mojang>", comMojangDir));
	}
}
