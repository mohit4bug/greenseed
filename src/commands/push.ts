import path from "node:path"

import dotenv from "dotenv"
import type postgres from "postgres"

import { loadConfig } from "../core/config"
import { check, connect, insert, metadata, validateTables } from "../core/database"
import { bold, dim, green, logger } from "../core/logger"
import type { Config, PushOptions, TableConfig } from "../types"
import { chunk } from "../utils/array"
import { loadJsonArray } from "../utils/fs"

interface TableSeed {
	table: TableConfig
	meta: { columns: string[] }
}

async function seedTables(
	sql: postgres.Sql,
	config: Config,
	configPath: string,
	entries: TableSeed[],
): Promise<void> {
	for (const entry of entries) {
		const t = entry.table
		const meta = entry.meta
		const source = path.resolve(path.dirname(configPath), t.source)
		const rows = loadJsonArray(source, config.onMissingFile || "error") as Record<string, unknown>[]

		if (rows.length === 0) {
			logger.warn(`Skipped ${bold(`${t.schema}.${t.table}`)} (no data)`)
			continue
		}

		const validCols = Object.keys(rows[0] as Record<string, unknown>).filter((c) =>
			meta.columns.includes(c),
		)

		logger.info(`Seeding ${bold(`${t.schema}.${t.table}`)}`)

		let inserted = 0
		for (const part of chunk(rows, 1000)) {
			// oxlint-disable-next-line eslint/no-await-in-loop
			inserted += await insert(
				sql,
				t.schema,
				t.table,
				part,
				validCols,
				t.primaryKeys,
				t.updateOnConflict || [],
				t.conflictTargetWhere || undefined,
			)
		}

		const hasConflict = t.updateOnConflict && t.updateOnConflict.length > 0
		const action = hasConflict ? "upserted" : "inserted"
		const skipped = rows.length - inserted

		if (inserted === rows.length) {
			logger.success(`${bold(`${t.schema}.${t.table}`)} ${green(`${action} ${inserted} rows`)}`)
		} else {
			logger.success(
				`${bold(`${t.schema}.${t.table}`)} ${green(`${action} ${inserted}`)}${dim(`, skipped ${skipped}`)}`,
			)
		}
	}
}

export async function push(opts: PushOptions): Promise<void> {
	dotenv.config()

	const { config, configPath } = loadConfig(opts.config)

	const dbVar = opts.dbvar && opts.dbvar.length > 0 ? opts.dbvar : config.databaseUrlEnvVar

	const dbUrl = process.env[dbVar]
	if (!dbUrl) {
		throw new Error(`Missing DB env var: ${dbVar}`)
	}

	logger.header("GreenSeed")
	logger.info(`Using config: ${dim(configPath)}`)
	logger.info(`Database: ${dim(dbVar)}`)

	const sql = connect(dbUrl)
	await check(sql)

	await validateTables(
		sql,
		config.tables.map((t) => ({
			table: t.table,
			schema: t.schema,
		})),
	)

	logger.success("Database connection established")
	logger.header("Seeding Tables")

	const seedEntries = await Promise.all(
		config.tables.map(async (t) => {
			const meta = await metadata(sql, t.schema, t.table)
			return { table: t, meta }
		}),
	)

	if (config.useTransaction) {
		logger.info("Using database transaction (rolls back on failure)")
		await sql.begin((txSql) => seedTables(txSql, config, configPath, seedEntries))
	} else {
		await seedTables(sql, config, configPath, seedEntries)
	}

	await sql.end()

	logger.header("Summary")
	logger.success(
		`Seeded ${bold(String(config.tables.length))} table${config.tables.length === 1 ? "" : "s"}`,
	)
}
