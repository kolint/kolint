#!/usr/bin/env node

import * as lint from '..'
import * as fs from 'fs'
import * as path from 'path'
import * as _glob from 'glob'

function color(code: number): string {
	return `\x1b[${code}m`
}

function log(filepath: string, diagnostics: lint.Diagnostic[]) {
	const longestMessageLength = diagnostics.reduce((a, b) => a.message.length > b.message.length ? a : b)?.message.length

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

async function main() {
	const filePatterns = process.argv.slice(2)
	const files = (await Promise.all(filePatterns.map(async pattern => glob(pattern)))).flat()

	let errors = 0
	let warnings = 0

	for (const file of files) {
		const filepath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
		const textDoc = fs.readFileSync(filepath).toString()

		try {
			const program = lint.createProgram()

			const document = program.parse(textDoc)

			const typescriptEmit = await program.typescriptCompiler.compile(filepath, document)

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
