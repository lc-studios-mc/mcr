import { z } from "zod/v4";

const BasePackBuildOptionsSchema = z.object({
	srcDir: z.string(),
	outDir: z.string(),
	include: z.array(z.string()).optional(),
	exclude: z.array(z.string()).optional(),
});

export const BPBuildOptionsSchema = z.object({
	...BasePackBuildOptionsSchema.shape,
});

export interface BPBuildOptions extends z.infer<typeof BPBuildOptionsSchema> {}

export const RPBuildOptionsSchema = z.object({
	...BasePackBuildOptionsSchema.shape,
});

export interface RPBuildOptions extends z.infer<typeof RPBuildOptionsSchema> {}

export const BuildOptionsSchema = z.object({
	include: z.array(z.string()).optional(),
	exclude: z.array(z.string()).optional(),
	bp: BPBuildOptionsSchema.optional(),
	rp: RPBuildOptionsSchema.optional(),
});

export interface BuildOptions extends z.infer<typeof BuildOptionsSchema> {
	bp?: BPBuildOptions;
	rp?: RPBuildOptions;
}
