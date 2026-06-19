import * as v from "valibot"

import type { Config } from "../types"
import { readFile, resolvePath } from "../utils/fs"

export const ConfigSchema = v.object({
	seedFileExtensions: v.array(v.picklist([".json"])),
	databaseUrlEnvVar: v.string(),
	onMissingFile: v.optional(v.picklist(["skip", "error"]), "error"),
	useTransaction: v.optional(v.boolean(), true),
	tables: v.array(
		v.object({
			table: v.string(),
			schema: v.optional(v.string(), "public"),
			primaryKeys: v.array(v.string()),
			source: v.string(),
			updateOnConflict: v.optional(v.nullable(v.array(v.string())), null),
			conflictTargetWhere: v.optional(v.nullable(v.string()), null),
		}),
	),
})

interface LoadConfigResult {
	config: Config
	configPath: string
}

export function loadConfig(configPath: string): LoadConfigResult {
	const resolved = resolvePath(configPath)

	let raw: unknown
	try {
		raw = JSON.parse(readFile(resolved))
	} catch (e) {
		throw new Error(
			`Failed to load config at ${resolved}: ${e instanceof Error ? e.message : String(e)}`,
			{ cause: e },
		)
	}

	const parsed = v.safeParse(ConfigSchema, raw)

	if (!parsed.success) {
		throw new Error("Invalid configuration")
	}

	return {
		config: parsed.output as Config,
		configPath: resolved,
	}
}
