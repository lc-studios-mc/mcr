#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { getPackageVersion } from "./utils.js";
import { createNewConfigFile, findConfig } from "./config.js";
import chalk from "chalk";
import { build } from "./build.js";

const program = new Command("mcr");

program.description("Minecraft Bedrock Addon Compiler");
program.version(getPackageVersion());

program
	.command("init")
	.description("Creates a new configuration file.")
	.option(
		"-c, --config <path>",
		"Specify the path where the new configuration will be, instead of mcr.config.mjs in the working directory.",
	)
	.action(async (opts) => {
		await createNewConfigFile(opts.config);
	});

program
	.command("build")
	.description("Builds a Minecraft Bedrock addon based on a configuration.")
	.option(
		"-c, --config <path>",
		"Specify the configuration file path, instead of mcr.config.mjs in the working directory.",
	)
	.option("--print-opts", "Prints the build options object to console.")
	.action(async (opts) => {
		const baseConfig = await findConfig(opts.config);

		if (baseConfig === undefined) {
			console.error(chalk.red("Configuration file does not exist. To create a new one, run 'mcr init'."));
			return;
		}

		if (opts.printOpts) {
			console.log(baseConfig.buildOptions);
		}

		await build(baseConfig.buildOptions);
	});

program.parseAsync();
