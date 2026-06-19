export interface TableConfig {
	table: string
	schema: string
	primaryKeys: string[]
	source: string
	updateOnConflict: string[] | null
	conflictTargetWhere: string | null
}

export interface Config {
	seedFileExtensions: string[]
	databaseUrlEnvVar: string
	onMissingFile: "skip" | "error"
	useTransaction: boolean
	tables: TableConfig[]
}

export interface PushOptions {
	config: string
	dbvar?: string
}

export interface InitOptions {
	config: string
}

export interface TableMeta {
	columns: string[]
}
