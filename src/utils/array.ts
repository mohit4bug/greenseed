export function chunk<T>(data: T[], size: number): T[][] {
	const out: T[][] = []
	for (let i = 0; i < data.length; i += size) {
		out.push(data.slice(i, i + size))
	}
	return out
}
