import { cosmiconfig } from "cosmiconfig";
import fs from "fs-extra";
import path from "node:path";
import { z } from "zod/v4";
import { BuildOptionsSchema, type BuildOptions } from "./build-options.js";
import { deepMerge } from "./utils.js";
import chalk from "chalk";

export const ConfigSchema = z.object({
	extends: z.string().optional(),
	buildOptions: BuildOptionsSchema,
});

export interface Config extends z.infer<typeof ConfigSchema> {
	buildOptions: BuildOptions;
}

const explorer = cosmiconfig("mcr");

/** @internal */
export async function findConfig(filePath?: string, loadedPaths: string[] = []): Promise<Config | undefined> {
	const searchResult = await (filePath === undefined ? explorer.search() : explorer.load(filePath));

	if (!searchResult) return;
	if (loadedPaths.includes(searchResult.filepath)) return;

	const rawConfig = searchResult.config;
	loadedPaths.push(searchResult.filepath);

	let parentConfig: Config | undefined;
	if (rawConfig && typeof rawConfig === "object" && "extends" in rawConfig && rawConfig.extends !== undefined) {
		const fullParentPath = path.resolve(path.dirname(searchResult.filepath), rawConfig.extends);
		parentConfig = await findConfig(fullParentPath, loadedPaths);
	}

	const merged = parentConfig === undefined ? rawConfig : deepMerge(parentConfig, rawConfig);
	const final = await ConfigSchema.parseAsync(merged);

	return final;
}

/** @internal */
export async function createNewConfigFile(filePath?: string): Promise<void> {
	const destPath = path.normalize(filePath ?? "mcr.config.mjs");

	if (await fs.pathExists(destPath)) {
		console.error(
			chalk.red(`A new configuration file was not created because another file already exists at ${destPath}.`),
		);
		return;
	}

	const contents = `/** @type {import("@lc-studios-mc/mcr").Config} */
export default {
	buildOptions: {
		bp: {
			srcDir: "src/bp",
			outDir: "out/bp",
			manifest: {},
		},
		rp: {
			srcDir: "src/rp",
			outDir: "out/rp",
			manifest: {},
		},
		// watch: true,
	}
}
`;

	await fs.outputFile(destPath, contents, "utf8");

	console.log(chalk.magenta("Created a new configuration file ->", chalk.underline(destPath)));
}
