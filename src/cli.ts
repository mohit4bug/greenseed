#!/usr/bin/env node
import sade from "sade"

import { init } from "./commands/init"
import { push } from "./commands/push"
import { colors } from "./core/logger"

const prog = sade("greenseed")

prog
	.command("push")
	.option("-c, --config <file>", "Config file", "seed.config.json")
	.option("-d, --dbvar <name>", "DB env var override")
	.action(async (opts) => {
		try {
			await push(opts)
		} catch (err) {
			console.error(`${colors.red}${colors.bold}Error:${colors.reset} ${String(err)}`)
			process.exit(1)
		}
	})

prog
	.command("init")
	.option("-c, --config <file>", "Config file", "seed.config.json")
	.action((opts) => {
		try {
			init(opts.config)
			console.log(
				`${colors.green}v${colors.reset} Config created: ${colors.bold}${opts.config}${colors.reset}`,
			)
		} catch (err) {
			console.error(`${colors.red}${colors.bold}Error:${colors.reset} ${String(err)}`)
			process.exit(1)
		}
	})

prog.parse(process.argv)
