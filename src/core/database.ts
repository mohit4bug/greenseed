import postgres from "postgres"

import { logger } from "./logger"

function toIdent(schema: string, table: string) {
	return `"${schema}"."${table}"`
}

export function connect(url: string): postgres.Sql {
	return postgres(url, { max: 10, idle_timeout: 20 })
}

export async function check(sql: postgres.Sql): Promise<void> {
	try {
		await sql`select 1`
	} catch {
		logger.fileError("Database connection failed")
		throw new Error("Failed to connect to database")
	}
}

export async function tableExists(
	sql: postgres.Sql,
	schema: string,
	table: string,
): Promise<boolean> {
	const ident = toIdent(schema, table)
	const res = await sql<{ exists: boolean }[]>`
    select to_regclass(${ident}) is not null as exists
  `
	if (!res[0]) {
		logger.fileError(`Failed to check table: ${schema}.${table}`)
		throw new Error(`Table check failed: ${schema}.${table}`)
	}
	return res[0].exists
}

export async function validateTables(
	sql: postgres.Sql,
	tables: { schema: string; table: string }[],
): Promise<void> {
	await Promise.all(
		tables.map(async (t) => {
			const ok = await tableExists(sql, t.schema, t.table)
			if (!ok) {
				logger.fileError(`Table does not exist: ${t.schema}.${t.table}`)
				throw new Error(`Missing table: ${t.schema}.${t.table}`)
			}
		}),
	)
}

export async function metadata(
	sql: postgres.Sql,
	schema: string,
	table: string,
): Promise<{ columns: string[] }> {
	const cols = await sql<{ column_name: string }[]>`
    select column_name
    from information_schema.columns
    where table_schema = ${schema}
    and table_name = ${table}
    order by ordinal_position
  `
	return { columns: cols.map((c) => c.column_name) }
}

export async function insert(
	sql: postgres.Sql,
	schema: string,
	table: string,
	rows: Record<string, any>[],
	columns: string[],
	primaryKeys: string[],
	updateOnConflict: string[],
	conflictTargetWhere?: string,
): Promise<number> {
	if (primaryKeys.length === 0) {
		logger.fileError(`No primary keys defined for ${schema}.${table}`)
		throw new Error(`No primary keys for ${schema}.${table}`)
	}

	const updateCols = updateOnConflict.filter((col) => !primaryKeys.includes(col))
	const conflictTarget = conflictTargetWhere
		? sql`(${sql(primaryKeys)}) where ${sql.unsafe(conflictTargetWhere)}`
		: sql`(${sql(primaryKeys)})`

	const updates = Object.fromEntries(updateCols.map((col) => [col, sql`excluded.${sql(col)}`]))

	const q =
		updateCols.length > 0
			? await sql`
      insert into ${sql(`${schema}.${table}`)}
      ${sql(rows, columns)}
      on conflict ${conflictTarget} do update set
      ${sql(updates)}
      returning ${sql(primaryKeys[0] ?? [])}
    `
			: await sql`
      insert into ${sql(`${schema}.${table}`)}
      ${sql(rows, columns)}
      on conflict ${conflictTarget} do nothing
      returning ${sql(primaryKeys[0] ?? [])}
    `
	return q.length
}
