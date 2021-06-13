#!/bin/node

const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

const entries = fs.readdirSync('spec/src')
	.filter(dir => dir.endsWith('.spec.ts'))
	.map(dir => path.join('spec/src', dir))

console.log(`------------------------------------
SPECIFICATION USES LAST BUILD
BE SURE TO BUILD BEFORE RUNNING SPEC
------------------------------------`)

esbuild.buildSync({
	entryPoints: entries,
	sourcemap: true,
	bundle: true,
	minify: true,
	platform: 'node',
	write: true,
	outdir: 'spec/build'
})
