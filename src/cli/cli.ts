import * as lint from '..'
import * as fs from 'fs'
import * as path from 'path'
import glob from 'tiny-glob'
import * as _yargs from 'yargs'
import { parse } from '../parser/parser'
import { createDocument } from '../parser/document-builder'
import { canonicalPath } from '../utils'
import { Diagnostic } from '../parser'
import { getConfigs, joinConfigs } from './config'

enum ExitCodes {
	Success,
	HasErrors,
	NoInputs,
	NoMatchingFiles,
	InputIsDirectory
}

interface Options {
	/** Output directory, works similarly to tsconfig's outDir. */
	out?: string | boolean
	/** TS output file extension, should start with dot. */
	outExt?: string
	/** Wether to output  */
	sourceMap?: boolean
}

interface ArgsOptions extends Options {
	/** Glob pattern or path to config files. Alias: '-c'. */
	config?: string
}

/** Options exclusive to config file. See options. */
export interface ConfigOptions extends Options {
	/** Severity for rules. Map with the key with the diagnostic name or code and the value as 'off', 'warning' or 'error'. */
	severity?: { [key: string]: 'off' | 'warning' | 'error' }
	/** Is root config. */
	root?: boolean
}

const yargs = (() => {
	let yargs = _yargs as unknown as _yargs.Argv<ArgsOptions>

	const options: { [key in keyof ArgsOptions]: _yargs.Options } = {
		config: {
			type: 'string',
			alias: ['c'],
			description: 'Glob pattern or path to config files'
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

	return yargs
})()

if (yargs.argv._.length < 1) {
	yargs.showHelp()
	process.exit(ExitCodes.Success)
}

function color(code: number): string {
	return `\x1b[${code}m`
}

function log(diagnostics: lint.Diagnostic[]) {
	for (const diag of diagnostics) {
		if (diag.severity === lint.Severity.Off) continue

		const severity = diag.severity === lint.Severity.Error ? 'error' : 'warning'
		const location = diag.location ? `${diag.location.first_line}:${diag.location.first_column}` : ''
		const unformattedRelativePath = canonicalPath(path.relative(process.cwd(), diag.filePath))
		const relativePath = unformattedRelativePath.startsWith('./') ? unformattedRelativePath : './' + unformattedRelativePath
		const link = `${relativePath}:${location}`
		console[diag.severity === lint.Severity.Error ? 'error' : 'log'](`${link} ${color(31)}${severity} ${color(90)}${diag.code}${color(0)} ${color(0)}${diag.message}`)
	}
}

function isOptionTrue(option: string | boolean | undefined): option is true | '' {
	return (['', true] as unknown[]).includes(option)
}

async function main() {
	const inputs = yargs.argv._
	if (inputs.length === 0) {
		console.error('No matching file(s)')
		process.exit(ExitCodes.NoInputs)
	}

	const files = (await Promise.all(inputs.map(async pattern => glob(pattern.toString())))).flat()
	if (files.length === 0) {
		console.error('No matching file(s)')
		process.exit(ExitCodes.NoMatchingFiles)
	}

	let errors = 0
	let warnings = 0

	const config = joinConfigs(await getConfigs(yargs.argv, process.cwd(), yargs.argv.config ? [yargs.argv.config] : ['.kolintrc', '.kolintrc.*']))
	const program = lint.createProgram()

	const documents = files.map(file => {
		const filepath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
		const stat = fs.statSync(filepath)

		if (stat.isDirectory()) {
			console.error(`Directory '${file}' is not a valid input file or glob.`)
			process.exit(ExitCodes.InputIsDirectory)
		}

		const textDoc = fs.readFileSync(filepath).toString()

		try {
			const ast = parse(textDoc, program)
			return createDocument(filepath, ast, program)
		} catch (err) {
			if (err instanceof Diagnostic) {
				program.addDiagnostic(err)
			} else {
				console.error(`${filepath}:`)
				console.error(err)
			}
		}
	}).filter((doc): doc is lint.Document => Boolean(doc))

	program.registerOutput = (filename, data, map) => {
		const mapJSON = map?.toJSON()
		const sources = mapJSON.sources ?? [filename]

		for (const source of sources) {
			const parsedSource = path.parse(source)

			if (config.out !== undefined) {
				let filepath: string | undefined

				if (isOptionTrue(config.out)) {
					filepath = path.join(parsedSource.dir, parsedSource.name) + (config.outExt ?? '.html.ts')
				} else if (typeof config.out === 'string') {
					filepath = path.join(config.out, parsedSource.name) + (config.outExt ?? '.html.ts')
				}

				if (filepath)
					fs.writeFileSync(filepath, data)
			}

			if (isOptionTrue(config.sourceMap)) {
				const filepath = path.join(typeof config.out === 'string' ? config.out : parsedSource.dir, parsedSource.name) + ((config.outExt ?? '.html.ts') + '.map')
				fs.writeFileSync(filepath, JSON.stringify(mapJSON))
			}
		}
	}

	try {
		const diagnostics = await program.compile(documents)

		for (const diag of diagnostics) {
			if (config.severity) {
				const severity = config.severity[diag.code] ?? config.severity[diag.name]

				if (severity === 'error') {
					diag.severity = lint.Severity.Error
				} else if (severity === 'warning') {
					diag.severity = lint.Severity.Warning
				} else if (severity === 'off') {
					diag.severity = lint.Severity.Off
				}
			}

			if (diag.severity === lint.Severity.Error)
				errors++
			if (diag.severity === lint.Severity.Warning)
				warnings++
		}

		const sortedDiags = diagnostics.slice().sort((a, b) => (a.location?.first_line ?? -1) - (b.location?.first_line ?? -1))
		log(sortedDiags)
	} catch (err) {
		if (err instanceof lint.Diagnostic)
			log([err])
		else
			throw err
	}

	if (errors > 0 || warnings > 0)
		console.log(`\n${color(errors > 0 ? 31 : 33)}✖ ${errors + warnings} problems (${errors} errors, ${warnings} warnings)${color(0)}\n`)

	if (errors > 0)
		process.exit(ExitCodes.HasErrors)
	else
		process.exit(ExitCodes.Success)
}

void main()
