export const colors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
	red: "\x1b[31m",
	gray: "\x1b[90m",
}

function colorize(color: string, msg: string) {
	return `${color}${msg}${colors.reset}`
}

export const logger = {
	info: (msg: string) => console.log(`${colors.blue}i${colors.reset} ${msg}`),
	success: (msg: string) => console.log(`${colors.green}v${colors.reset} ${msg}`),
	warn: (msg: string) => console.log(`${colors.yellow}w${colors.reset} ${msg}`),
	error: (msg: string) => console.log(`${colors.red}x${colors.reset} ${msg}`),
	dim: (msg: string) => console.log(`${colors.dim}${msg}${colors.reset}`),
	header: (msg: string) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
	table: (label: string, value: string | number) =>
		console.log(`  ${colors.dim}${label}:${colors.reset} ${colors.bold}${value}${colors.reset}`),
	progress: (current: number, total: number, label: string) => {
		const percentage = Math.round((current / total) * 100)
		const bar = "\u2588".repeat(Math.floor(percentage / 5))
		const empty = "\u2591".repeat(20 - Math.floor(percentage / 5))
		console.log(
			`  ${colors.cyan}${bar}${empty}${colors.reset} ${colors.bold}${percentage}%${colors.reset} ${colors.dim}(${current}/${total})${colors.reset} ${label}`,
		)
	},
	rawError: (msg: string) =>
		console.error(`${colors.red}${colors.bold}Error:${colors.reset} ${msg}`),
	fileError: (msg: string) =>
		console.error(`${colors.red}x${colors.reset} ${colors.dim}${msg}${colors.reset}`),
}

export function bold(msg: string): string {
	return colorize(colors.bold, msg)
}

export function dim(msg: string): string {
	return colorize(colors.dim, msg)
}

export function green(msg: string): string {
	return colorize(colors.green, msg)
}

export function red(msg: string): string {
	return colorize(colors.red, msg)
}
