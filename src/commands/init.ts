import fs from "node:fs"

import { logger } from "../core/logger"
import { resolvePath } from "../utils/fs"

const DEFAULT_CONFIG = {
	$schema: "./node_modules/greenseed/dist/schema/configuration_schema.json",
	seedFileExtensions: [".json"],
	databaseUrlEnvVar: "DATABASE_URL",
	onMissingFile: "error",
	useTransaction: true,
	tables: [
		{
			table: "example_table",
			schema: "public",
			primaryKeys: ["id"],
			source: "./data/example_table.json",
			updateOnConflict: [],
			conflictTargetWhere: null,
		},
	],
}

export function init(configPath: string): void {
	const resolved = resolvePath(configPath)

	if (fs.existsSync(resolved)) {
		logger.fileError(`Config file already exists: ${resolved}`)
		throw new Error(`Config already exists: ${resolved}`)
	}

	fs.writeFileSync(resolved, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, "utf8")
}
