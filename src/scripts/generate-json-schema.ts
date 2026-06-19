import fs from "node:fs"
import path from "node:path"

import { toJsonSchema } from "@valibot/to-json-schema"

import { ConfigSchema } from "../core/config"

const outputPath = path.resolve(__dirname, "../schema/configuration_schema.json")

const jsonSchema = toJsonSchema(ConfigSchema)
fs.writeFileSync(outputPath, `${JSON.stringify(jsonSchema, null, 4)}\n`, "utf-8")
