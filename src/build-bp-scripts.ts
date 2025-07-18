import esbuild from "esbuild";
import fs from "fs-extra";
import type { BPBuildOptions, BuildOptions } from "./build-options.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dimmedTimeString, isFileUrl } from "./utils.js";
import chalk from "chalk";

/** @internal */
export async function buildBpScripts(packOpts: BPBuildOptions, opts: BuildOptions): Promise<void> {
	const scriptOpts = packOpts.script;

	if (!scriptOpts) return;

	const sourceRoot = path.dirname(path.resolve(packOpts.srcDir, scriptOpts.entryPointRelativeToSrcDir));
	const destScriptsDir = path.join(path.resolve(packOpts.outDir), "scripts");

	let esbuildOpts: esbuild.BuildOptions = {
		absWorkingDir: path.resolve(packOpts.srcDir),
		format: "esm",
		platform: "neutral",
		banner: scriptOpts.banner,
		footer: scriptOpts.footer,
		write: false, // Necessary for custom write plugin below
		plugins: [
			{
				name: "custom-write",
				setup(build) {
					build.onEnd((result) => {
						if (!result.outputFiles) return;

						for (const outputFile of result.outputFiles) {
							let toWrite = outputFile.text;

							// Tweak source map contents for Minecraft script debugger
							if (scriptOpts.sourceMap && path.extname(outputFile.path) === ".map") {
								const data = JSON.parse(outputFile.text);
								const sources = data.sources as string[];

								data.sources = sources.map((urlOrPathAbs) => {
									const absPath = path.resolve(
										destScriptsDir,
										isFileUrl(urlOrPathAbs) ? fileURLToPath(urlOrPathAbs) : urlOrPathAbs,
									);

									const relativePath = path.relative(sourceRoot, absPath);

									return relativePath;
								});

								toWrite = JSON.stringify(data, null, 2);
							}

							fs.outputFile(outputFile.path, toWrite, "utf8");
						}
					});
				},
			},
			{
				name: "build-log",
				setup(build) {
					build.onEnd(() => {
						console.log(dimmedTimeString(), "Bundled bp scripts.");
					});
				},
			},
		],
	};

	if (scriptOpts.bundle) {
		esbuildOpts = {
			...esbuildOpts,
			entryPoints: [scriptOpts.entryPointRelativeToSrcDir],
			bundle: true,
			minify: scriptOpts.minify,
			external: scriptOpts.external ?? ["@minecraft"],
			outfile: path.join(
				destScriptsDir,
				path.basename(scriptOpts.entryPointRelativeToSrcDir).replace(/\.[^/.]+$/, "") + ".js",
			),
		};
	} else {
		esbuildOpts = {
			...esbuildOpts,
			entryPoints: ["scripts/**/*"],
			bundle: false,
			outdir: destScriptsDir,
		};
	}

	if (scriptOpts.tsconfig) {
		esbuildOpts = {
			...esbuildOpts,
			tsconfig: path.resolve(scriptOpts.tsconfig),
		};
	}

	if (scriptOpts.sourceMap) {
		esbuildOpts = {
			...esbuildOpts,
			sourcemap: true,
			sourceRoot,
		};
	}

	await fs.ensureDir(destScriptsDir);
	await fs.emptyDir(destScriptsDir);

	let ctx: esbuild.BuildContext | undefined = undefined;

	if (opts.watch) {
		ctx = await esbuild.context(esbuildOpts);
		ctx.watch();

		console.log(
			dimmedTimeString(),
			chalk.cyan(`Watching for file changes in bp scripts...`, chalk.underline("(Press CTRL+c to stop)")),
		);
	} else {
		await esbuild.build(esbuildOpts);
	}

	if (!ctx) return;

	process.once("SIGINT", async () => {
		await ctx.cancel();
		await ctx.dispose();

		console.log(dimmedTimeString(), chalk.cyan(`Closed the watcher for bp scripts`));
	});
}
