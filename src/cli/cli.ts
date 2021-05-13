#!/usr/bin/env node

import * as lint from '..'
import * as fs from 'fs'
import * as path from 'path'
import * as _glob from 'glob'
import * as _yargs from 'yargs'
import { parse } from '../parser/parser'
import { createDocument } from '../parser/document-builder'
import { canonicalPath } from '../utils'
import { Diagnostic } from '../parser'

interface Options {
	/** Root directory, defaults to cwd. */
	root?: string | boolean
	/** Output directory, works similarly to tsconfig's outDir. */
	out?: string
	/** TS output file extension, should start with dot. */
	outExt?: string
}

interface ArgsOptions extends Options {
	/** Glob pattern or path to config files. Alias: '-c'. */
	config?: string
}

/** Options exclusive to config file. See options. */
export interface ConfigOptions extends Options {
	/** Severity for rules. Map with the key with the diagnostic name or code and the value as 'off', 'warning' or 'error'. */
	severity?: { [key: string]: 'off' | 'warning' | 'error' }
}

const yargs = (() => {
	let yargs = _yargs

	const options: { [key in keyof ArgsOptions]: _yargs.Options } = {
		config: {
			type: 'string',
			alias: ['c'],
			description: 'Glob pattern or path to config files'
		},
		root: {
			type: 'string',
			description: 'Root directory, defaults to cwd'
		},
		out: {
			type: 'string',
			description: 'Output directory, works similarly to tsconfig\'s outDir'
		},
		outExt: {
			type: 'string',
			description: 'TS output file extension, should start with dot'
		}
	}

	for (const [key, _options] of Object.entries(options)) {
		if (!_options) continue
		yargs = yargs.option(key, _options)
	}

	return yargs as _yargs.Argv<Options>
})()

if (yargs.argv._.length < 1) {
	yargs.showHelp()
	process.exit(1)
}

function color(code: number): string {
	return `\x1b[${code}m`
}

function log(diagnostics: lint.Diagnostic[]) {
	for (const diag of diagnostics) {
		if (diag.severity === lint.Severity.Off) continue

		const severity = diag.severity === lint.Severity.Error ? 'error' : 'warning'
		const location = diag.location ? `${diag.location.first_line}:${diag.location.first_column}` : ''
		const relativePath = './' + canonicalPath(path.relative(process.cwd(), diag.filePath))
		const link = `${relativePath}(${location})`
		console[diag.severity === lint.Severity.Error ? 'error' : 'log'](`${link} ${color(31)}${severity} ${color(90)}${diag.code}${color(0)} ${color(0)}${diag.message}`)
	}
}

async function glob(pattern: string) {
	return new Promise<string[]>((res, rej) => _glob(pattern, (err: unknown, matches: string[]) => {
		if (err) return rej(err)
		return res(matches)
	}))
}

async function main() {
	const files = (await Promise.all(yargs.argv._.filter((option): option is string => typeof option === 'string').map(async pattern => glob(pattern)))).flat()
	if (files.length === 0) {
		console.error('No matching file(s)')
		process.exit(2)
	}

	let errors = 0
	let warnings = 0

	const program = lint.createProgram()
	const documents = files.map(file => {
		const filepath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
		const textDoc = fs.readFileSync(filepath).toString()
		// const config = joinConfigs(getConfigs(yargs.argv, path.parse(filepath).dir))

		try {
			const ast = parse(textDoc, program)
			return createDocument(filepath, ast, program)
		} catch (err) {
			if (err instanceof Diagnostic)
				program.addDiagnostic(err)
			else
			{
				console.error(`${filepath}:`)
				console.error(err)
			}
		}
	}).filter((e): e is lint.Document => Boolean(e))

	try {
		const diagnostics = await program.compile(documents)
		// if (diagnostics.length > 0)
		// 	console.log(`\n${color(90)}${filepath.replace(/\\/g, '/')}${color(0)}`)

		for (const diag of diagnostics) {
			if (diag.severity === lint.Severity.Error)
				errors++
			if (diag.severity === lint.Severity.Warning)
				warnings++
		}

		// if (config.out) {
		// 	const outDir = path.join(typeof config.root === 'string' ? config.root : process.cwd(), config.out)
		// 	const outFilePath = path.join(outDir, path.relative(filesFolder, path.parse(file).name + (config.outExt ?? '.ko.ts')))
		// 	ensureDirectoryExistence(outFilePath)
		// 	const fileContent = fs.readFileSync(outFileHandle, 'utf8')
		// 	if (!fileContent)
		// 		throw new Error('Catastrophic Error. The generated file is not available.')
		// 	fs.writeFileSync(outFilePath, fileContent)
		// }

		const sortedDiags = diagnostics?.slice().sort((a, b) => (a.location?.first_line ?? -1) - (b.location?.first_line ?? -1))
		log(sortedDiags)
	} catch (err) {
		if (err instanceof lint.Diagnostic)
			log([err])
		else
			throw err
	}

	if (errors > 0 || warnings > 0)
		console.log(`\n${color(errors > 0 ? 31 : 33)}✖ ${errors + warnings} problem (${errors} errors, ${warnings} warning)${color(0)}\n`)

	if (errors > 0)
		process.exit(1)
	else
		process.exit(0)
}

void main()
