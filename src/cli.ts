#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { getPackageVersion } from "./utils.js";

const program = new Command("mcr");

program.description("Minecraft Bedrock Addon Compiler");
program.version(getPackageVersion());

program.parseAsync();
