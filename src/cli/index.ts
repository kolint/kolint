import * as kolint from '..'
import * as fs from 'fs'
import * as path from 'path'
import glob from 'tiny-glob'
import * as yargs from 'yargs'
import { parse } from '../parser'
import { createDocument } from '../parser/document-builder'
import { Diagnostic } from '../diagnostic'
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
	/** Wether to output sourceMaps */
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

function argvOptions<T extends { [key in Required<keyof ArgsOptions>]: yargs.Options }>(c: T) {
	return yargs.options(c).argv
}

function color(code: number): string {
	return `\x1b[${code}m`
}

function log(diagnostics: kolint.Diagnostic[]) {
	for (const diag of diagnostics) {
		if (diag.severity === kolint.Severity.Off) continue

		const severity = diag.severity === kolint.Severity.Error ? 'error' : 'warning'
		const location = diag.location ? `${diag.location.first_line}:${diag.location.first_column}` : ''
		const unformattedRelativePath = kolint.utils.canonicalPath(path.relative(process.cwd(), diag.filePath))
		const relativePath = /\.?\.\//.test(unformattedRelativePath) ? unformattedRelativePath : './' + unformattedRelativePath
		const link = `${relativePath}:${location}`
		console[diag.severity === kolint.Severity.Error ? 'error' : 'log'](`${link} ${color(31)}${severity} ${color(90)}${diag.code}${color(0)} ${color(0)}${diag.message}`)
	}
}

function isOptionTrue(option: string | boolean | undefined): option is true | '' {
	return (['', true] as unknown[]).includes(option)
}

async function asyncify<T>(value: Promise<T> | T): Promise<T> {
	if (typeof value === 'object' && typeof (value as typeof value & { then?: unknown }).then === 'function') {
		return value as unknown as Promise<T>
	} else {
		return Promise.resolve(value as unknown as T)
	}
}

// Async function wrapper
async function main() {
	const argv = await asyncify(argvOptions({
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
		},
		sourceMap: {
			type: 'string',
			description: 'Wether to output sourceMaps'
		}
	}))

	if (argv._.length < 1) {
		yargs.showHelp()
		process.exit(ExitCodes.Success)
	}

	const inputs = argv._
	if (inputs.length === 0) {
		console.error('No matching file(s)')
		process.exit(ExitCodes.NoInputs)
	}

	const files = kolint.utils.flat(await Promise.all(inputs.map(async pattern => glob(kolint.utils.canonicalPath(pattern.toString())))))
	if (files.length === 0) {
		console.error('No matching file(s)')
		process.exit(ExitCodes.NoMatchingFiles)
	}

	let errors = 0
	let warnings = 0

	const config = joinConfigs(await getConfigs(argv, process.cwd(), argv.config ? [argv.config] : ['.kolintrc', '.kolintrc.*']))
	const program = kolint.createProgram()

	// TODO: Remove this hard-coded disabling when it is possible to enable/disable rules in the configuration.
	program.disableDiagnostics(['KO0002'])

	const documents = files.map(file => {
		const filepath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
		const stat = fs.statSync(filepath)

		if (stat.isDirectory()) {
			console.error(`Directory '${file}' is not a valid input file or glob.`)
			process.exit(ExitCodes.InputIsDirectory)
		}

		const textDoc = fs.readFileSync(filepath).toString()

		try {
			const ast = parse(filepath, textDoc, program)
			return createDocument(filepath, ast, program)
		} catch (err) {
			if (err instanceof Diagnostic) {
				program.addDiagnostic(err)
			} else {
				console.error(`${filepath}:`)
				console.error(err)
			}
		}
	}).filter((doc): doc is kolint.Document => Boolean(doc))

	program.registerOutput = (filename, data, map) => {
		const defaultOutExt = '.html.ts'
		const outExt = config.outExt ?? defaultOutExt
		const mapOutExit = outExt + '.map'

		const mapJSON = map?.toJSON()
		const parsedFileName = path.parse(filename)

		if (config.out !== undefined) {
			let filepath: string | undefined

			if (isOptionTrue(config.out)) {
				filepath = path.join(parsedFileName.dir, parsedFileName.name) + outExt
			} else if (typeof config.out === 'string') {
				filepath = path.join(config.out, parsedFileName.name) + outExt
			}

			if (filepath)
				fs.writeFileSync(filepath, data)
		}

		if (isOptionTrue(config.sourceMap)) {
			const filepath = path.join(typeof config.out === 'string' ? config.out : parsedFileName.dir, parsedFileName.name) + mapOutExit
			fs.writeFileSync(filepath, JSON.stringify(mapJSON))
		}
	}

	try {
		const diagnostics = await program.compile(documents)

		for (const diag of diagnostics) {
			if (config.severity) {
				const severity = config.severity[diag.code] ?? config.severity[diag.name]

				if (severity === 'error') {
					diag.severity = kolint.Severity.Error
				} else if (severity === 'warning') {
					diag.severity = kolint.Severity.Warning
				} else if (severity === 'off') {
					diag.severity = kolint.Severity.Off
				}
			}

			if (diag.severity === kolint.Severity.Error)
				errors++
			if (diag.severity === kolint.Severity.Warning)
				warnings++
		}

		const sortedDiags = diagnostics.slice().sort((a, b) => {
			if (a.filePath < b.filePath) return -1
			if (a.filePath > b.filePath) return 1
			const byLine = (a.location?.first_line ?? -1) - (b.location?.first_line ?? -1)
			const byCol = (a.location?.first_column ?? -1) - (b.location?.first_column ?? -1)
			return byLine || byCol
		})

		log(sortedDiags)
	} catch (err) {
		if (err instanceof kolint.Diagnostic)
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
