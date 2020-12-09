#!/usr/bin/env node

import * as lint from '..'
import * as fs from 'fs'
import * as path from 'path'
import * as _glob from 'glob'
import * as yargs from 'yargs'
import { getConfigs, joinConfigs } from './config'

interface _Config {
	[key: string]: {
		type: 'array' | 'boolean' | 'number' | 'string'
		description: string
		alias?: readonly string[]
		default?: unknown
	}
}

export type Config = {
	[key in keyof typeof config]:
	(typeof config)[key]['type'] extends 'array' ? unknown[] :
	(typeof config)[key]['type'] extends 'boolean' ? boolean :
	(typeof config)[key]['type'] extends 'number' ? number :
	(typeof config)[key]['type'] extends 'string' ? string :
	never
}
const config = (<T extends _Config>(x: T) => x)({
	config: {
		type: 'string',
		alias: ['c'],
		description: 'glob pattern or path to config files'
	},
	'ts-base': {
		type: 'string',
		description: 'TS base folder, defaults to cwd'
	},
	'ts-out': {
		type: 'string',
		description: 'TS output folder, works simmilary to tsconfig'
	},
	'ts-ext': {
		type: 'string',
		description: 'TS output file extension, should start with dot'
	}
})

const { argv: args } = (() => {
	let args = yargs

	for (const [key, options] of Object.entries(config)) {
		args = args.option(key, options)
	}

	return args as yargs.Argv<Partial<Config>>
})()

function color(code: number): string {
	return `\x1b[${code}m`
}

function log(filepath: string, diagnostics: lint.Diagnostic[]) {
	// Can not call reduce on empty array: https://mzl.la/2HSk4nW
	const longestMessageLength = diagnostics.length > 0 ? diagnostics.reduce((a, b) => a.message.length > b.message.length ? a : b)?.message.length : 0

	for (const diag of diagnostics) {
		if (diag.severity === lint.Severity.Off) continue

		const severity = diag.severity === lint.Severity.Error ? 'error' : 'warning'
		const location = diag.location ? `${diag.location.first_line}:${diag.location.first_column}` : ''
		// const link = `${path.relative(process.cwd(), filepath).replace(/^(?:\.(?:\/|\\)|)/, './').replace(/\\/g, '/')}${location}`

		console[diag.severity === lint.Severity.Error ? 'error' : 'log'](`  ${location.padEnd(9, ' ')}${color(31)}${severity.padEnd(9, ' ')}${color(0)}${diag.message.padEnd(longestMessageLength, ' ')}  ${color(90)}${diag.code}${color(0)}`)
	}
}

async function glob(pattern: string) {
	return new Promise<string[]>((res, rej) => _glob(pattern, (err: unknown, matches: string[]) => {
		if (err) return rej(err)
		return res(matches)
	}))
}

function getFolderSegments(file: string) {
	return file.split(/\\|\//g)
}

function getContainingFolder(files: string[]) {
	const getFilesFolderSegments = (file: string) => {
		let segments = getFolderSegments(file).slice(0, -1)

		if (/[A-Za-z]:/.test(segments[0]))
			segments = segments.slice(1)

		return segments
	}

	let segments = getFilesFolderSegments(files[0])

	for (const file of files.slice(1)) {
		const fileSegments = getFilesFolderSegments(file)

		segments = segments.filter((segment, index) => segment === fileSegments[index])
	}

	return segments.join(path.sep)
}

function ensureDirectoryExistence(filePath: string) {
	const dirname = path.dirname(filePath)
	if (fs.existsSync(dirname)) return
	ensureDirectoryExistence(dirname)
	fs.mkdirSync(dirname)
}

async function main() {
	const filePatterns = process.argv.slice(2)
	const files = (await Promise.all(filePatterns.map(async pattern => glob(pattern)))).flat()
	const filesFolder = getContainingFolder(files)

	let errors = 0
	let warnings = 0

	for (const file of files) {
		const filepath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
		const textDoc = fs.readFileSync(filepath).toString()

		try {
			const program = lint.createProgram()

			const document = program.parse(textDoc)

			const typescriptEmit = await program.compile(filepath, document)

			const diagnostics = new Array<lint.Diagnostic>().concat(
				typescriptEmit.getDiagnostics(),
				program.getDiagnostics()
			).sort((a, b) => (a.location?.first_line ?? -1) - (b.location?.first_line ?? -1))

			if (diagnostics.length > 0)
				console.log(`\n${color(90)}${filepath.replace(/\\/g, '/')}${color(0)}`)

			for (const diag of diagnostics) {
				if (diag.severity === lint.Severity.Error)
					errors++
				if (diag.severity === lint.Severity.Warning)
					warnings++
			}

			const parsedFilePath = path.parse(filepath)

			// Remove the below line when config is used.
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const config = joinConfigs(getConfigs(parsedFilePath.dir))

			if (args['ts-out']) {
				const outDir = path.join(args['ts-base'] ?? process.cwd(), args['ts-out'])

				const outFile = path.join(outDir, path.relative(filesFolder, path.parse(file).name + (args['ts-ext'] ?? '.ko.ts')))

				ensureDirectoryExistence(outFile)

				fs.writeFileSync(outFile, typescriptEmit.rawSource)
			}

			log(filepath, diagnostics)
		} catch (err) {
			if (err instanceof lint.Diagnostic)
				log(filepath, [err])
			else
				throw err
		}
	}

	if (errors > 0 || warnings > 0)
		console.log(`\n${color(errors > 0 ? 31 : 33)}✖ ${errors + warnings} problem (${errors} errors, ${warnings} warning)${color(0)}\n`)

	if (errors > 0)
		process.exit(1)
	else
		process.exit(0)
}

void main()
