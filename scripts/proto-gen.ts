/**
 * Proto code generation script for @tieba/sdk.
 * Uses ts-proto via protoc to generate TypeScript from .proto files.
 *
 * All proto files are in a single `proto/` directory at the SDK root,
 * and all generated TypeScript goes to `src/generated/`.
 *
 * Usage: bun run scripts/proto-gen.ts
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const SDK_ROOT = resolve(import.meta.dirname, "..");
const PROTO_DIR = join(SDK_ROOT, "proto");
const OUT_DIR = join(SDK_ROOT, "src/generated");

const TS_PROTO_OPTS = [
	"--ts_proto_opt=outputServices=false",
	"--ts_proto_opt=esModuleInterop=true",
	"--ts_proto_opt=forceLong=string",
	"--ts_proto_opt=env=node",
	"--ts_proto_opt=useExactTypes=false",
	"--ts_proto_opt=outputExtensions=true",
].join(" ");

if (!existsSync(OUT_DIR)) {
	mkdirSync(OUT_DIR, { recursive: true });
}

const protoFiles = readdirSync(PROTO_DIR)
	.filter((f) => f.endsWith(".proto"))
	.map((f) => join(PROTO_DIR, f));

if (protoFiles.length === 0) {
	console.log("No proto files found.");
	process.exit(0);
}

console.log(`Generating ${protoFiles.length} proto files → src/generated/`);

const cmd = [
	"protoc",
	`--ts_proto_out=${OUT_DIR}`,
	TS_PROTO_OPTS,
	`--proto_path=${PROTO_DIR}`,
	protoFiles.join(" "),
].join(" ");

execSync(cmd, { stdio: "inherit", cwd: SDK_ROOT });

console.log("Proto generation complete!");
