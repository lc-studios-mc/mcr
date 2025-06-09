import { z } from "zod/v4";

const SharedOptionsSchema = z.object({
	removeOrphans: z.boolean().optional(),
	watch: z.boolean().optional(),
});

const BasePackBuildOptions = z.object({
	...SharedOptionsSchema.shape,
	srcDir: z.string(),
	outDir: z.string(),
	manifest: z.any(),
	include: z.array(z.string()).optional(),
	exclude: z.array(z.string()).optional(),
});

export const BPBuildOptionsSchema = z.object({
	...BasePackBuildOptions.shape,
});

export interface BPBuildOptions extends z.infer<typeof BPBuildOptionsSchema> {}

export const RPBuildOptionsSchema = z.object({
	...BasePackBuildOptions.shape,
	generateTextureList: z.boolean().optional(),
});

export interface RPBuildOptions extends z.infer<typeof RPBuildOptionsSchema> {}

export const BuildOptionsSchema = z.object({
	...SharedOptionsSchema.shape,
	bp: BPBuildOptionsSchema.optional(),
	rp: RPBuildOptionsSchema.optional(),
});

export interface BuildOptions extends z.infer<typeof BuildOptionsSchema> {
	bp?: BPBuildOptions;
	rp?: RPBuildOptions;
}
