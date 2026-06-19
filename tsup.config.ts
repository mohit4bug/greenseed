import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/cli.ts", "src/index.ts"],
	format: ["cjs", "esm"],
	dts: true,
	splitting: false,
	sourcemap: true,
	clean: true,
	treeshake: true,
	minify: false,
	outDir: "dist",
	onSuccess:
		"mkdir -p dist/schema && cp src/schema/configuration_schema.json dist/schema/configuration_schema.json",
})
