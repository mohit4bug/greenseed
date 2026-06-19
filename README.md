# Greenseed

Greenseed is a small CLI tool to seed a PostgreSQL database from JSON files.

## Installation

```bash
pnpm add greenseed
```

Or install it globally:

```bash
pnpm add -g greenseed
```

Install via npm:

```bash
npm install greenseed
```

```bash
npm install -g greenseed
```

Install via bun:

```bash
bun install greenseed
```

```bash
bun install -g greenseed
```

Or install the standalone binary (no runtime required):

```bash
curl -fsSL https://raw.githubusercontent.com/mohit4bug/greenseed/main/install.sh | bash
```

## Quick Start

Generate a seed configuration file:

```bash
greenseed init
```

Then run the seed:

```bash
greenseed push
```

## Configuration

Greenseed reads a `seed.config.json` file in the current directory. You can specify a custom path with the `-c` flag.

### `seedFileExtensions`

Allowed seed file extensions. Currently only `.json` is supported.

```json
[".json"]
```

### `databaseUrlEnvVar`

The name of the environment variable containing the PostgreSQL connection string.

```json
"DATABASE_URL"
```

### `onMissingFile`

Behaviour when a source data file does not exist.

- `"error"` — throws an error and stops the seed (default)
- `"skip"` — silently skips the table

### `useTransaction`

When `true` (default), the entire seed runs inside a single database transaction. If any insert fails, all changes are rolled back.

```json
true
```

### `tables`

Array of table configurations. Each entry defines a table to seed.

| Option                | Required | Default    | Description                                     |
| --------------------- | -------- | ---------- | ----------------------------------------------- |
| `table`               | Yes      | —          | Database table name                             |
| `schema`              | No       | `"public"` | Database schema the table belongs to            |
| `primaryKeys`         | Yes      | —          | Column names used for conflict detection        |
| `source`              | Yes      | —          | Path to the JSON data file (relative to config) |
| `updateOnConflict`    | No       | `null`     | Columns to update on conflict (upsert)          |
| `conflictTargetWhere` | No       | `null`     | Predicate for partial unique indexes            |

### Example

```json
{
	"$schema": "./node_modules/greenseed/dist/schema/configuration_schema.json",
	"seedFileExtensions": [".json"],
	"databaseUrlEnvVar": "DATABASE_URL",
	"onMissingFile": "error",
	"useTransaction": true,
	"tables": [
		{
			"table": "users",
			"schema": "public",
			"primaryKeys": ["id"],
			"source": "./data/users.json"
		},
		{
			"table": "orders",
			"schema": "public",
			"primaryKeys": ["id"],
			"source": "./data/orders.json",
			"updateOnConflict": ["status", "updated_at"],
			"conflictTargetWhere": "is_active = true"
		}
	]
}
```

## JSON Seed Files

Each source file must be a valid JSON array of objects. Extra object properties that do not exist as columns in the target table are automatically ignored.

```json
[
	{ "id": 1, "name": "Alice", "email": "alice@example.com" },
	{ "id": 2, "name": "Bob", "email": "bob@example.com" }
]
```

## CLI Reference

### `greenseed init`

Generates a `seed.config.json` file with example configuration.

| Option                | Description      | Default            |
| --------------------- | ---------------- | ------------------ |
| `-c, --config <file>` | Config file path | `seed.config.json` |

### `greenseed push`

Connects to the database and seeds all configured tables.

| Option                | Description                                         | Default            |
| --------------------- | --------------------------------------------------- | ------------------ |
| `-c, --config <file>` | Config file path                                    | `seed.config.json` |
| `-d, --dbvar <name>`  | Override the database URL environment variable name | Value from config  |

The push command:

1. Loads and validates the configuration
2. Reads the database URL from the environment variable
3. Connects to PostgreSQL and verifies all tables exist
4. Reads each table's source JSON file and inserts data in batches
5. Reports progress and a final summary

### Environment Variables

The database connection URL must be set in the environment. By default, Greenseed reads from `DATABASE_URL`.

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
greenseed push
```

Override the variable name at runtime with the `-d` flag:

```bash
export MY_DB="postgresql://user:password@localhost:5432/mydb"
greenseed push --dbvar MY_DB
```

## License

MIT
