import fs from "node:fs"
import path from "node:path"

import { logger } from "../core/logger"

export function exists(p: string): boolean {
	return fs.existsSync(p)
}

export function readFile(p: string): string {
	try {
		return fs.readFileSync(p, "utf8")
	} catch {
		logger.fileError(`Failed to read file: ${p}`)
		throw new Error(`File read error: ${p}`)
	}
}

export function resolvePath(p: string): string {
	return path.resolve(process.cwd(), p)
}

export function ext(p: string): string {
	return path.extname(p).toLowerCase()
}

export function loadJsonArray(p: string, onMissing: "skip" | "error"): unknown[] {
	if (!exists(p)) {
		if (onMissing === "skip") {
			return []
		}
		logger.fileError(`Source file not found: ${p}`)
		throw new Error(`Missing file: ${p}`)
	}

	const raw = readFile(p)

	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		logger.fileError(`Invalid JSON in file: ${p}`)
		throw new Error(`JSON parse error: ${p}`)
	}

	if (!Array.isArray(parsed)) {
		logger.fileError(`Expected array but got ${typeof parsed}: ${p}`)
		throw new Error(`Invalid data format: ${p}`)
	}

	return parsed
}
