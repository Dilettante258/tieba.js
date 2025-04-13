import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import {defineConfig} from "rollup";
import progress from "rollup-plugin-progress";

export default defineConfig({
	treeshake: {
		moduleSideEffects: true,
		annotations: true,
	},
	external: [
		"node-html-parser",
		"buffer",
		"crypto",
		"protobufjs",
		"long",
		"@protobufjs",
		"node-cache",
	],
	input: "src/index.ts",
	output: {
		dir: "dist",
		preserveModules: true,
		preserveModulesRoot: "src",
		entryFileNames: "[name].js",
		format: "module",
	},
	plugins: [
		typescript({
			exclude: "./src/pb-gen/*.js",
		}),
		nodeResolve({
			moduleDirectories: ["node_modules"],
		}),
		progress(),
		commonjs(),
	],
});
