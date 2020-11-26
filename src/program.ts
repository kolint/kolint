import { createDocument, Document, Node, parse } from './parser'
import { Diagnostic } from './diagnostic'
import { Compiler } from './compiler'
import * as ts from 'typescript'
import { SourceMapConsumer } from 'source-map'
import { canonicalPath } from './utils'

export interface Reporting {
	addDiagnostic(...diags: Diagnostic[]): void
	disableAllDiagnostics(): void
	disableDiagnostics(keys: string[]): void
	enableAllDiagnostics(): void
	enableDiagnostics(keys: string[]): void
}

export interface CompilerResult {
	rawSource: string
	sourceMap: string
	getDiagnostics(): Diagnostic[]
}

export function createProgram(): Program {
	return new Program()
}

export class Program implements Reporting {
	private diagnostics: Diagnostic[] = []

	private allDiagnosticsDisabled = false
	private disabledDiagnostics: string[] = []

	public addDiagnostic(...diags: Diagnostic[]) : void {
		if (this.allDiagnosticsDisabled) return
		for (const diag of diags)
			if (this.disabledDiagnostics.includes(diag.code) || this.disabledDiagnostics.includes(diag.name)) return
		this.diagnostics = this.diagnostics.concat(diags)
	}

	public getDiagnostics(): Diagnostic[] {
		return this.diagnostics
	}

	// Disable all diags
	public disableAllDiagnostics(): void {
		this.allDiagnosticsDisabled = true
	}

	// Disable diags for keys
	public disableDiagnostics(keys: string[]): void {
		this.disabledDiagnostics = this.disabledDiagnostics.concat(keys)
	}

	// Enable all diagnostics
	public enableAllDiagnostics(): void {
		this.allDiagnosticsDisabled = false
		this.disabledDiagnostics = []
	}

	// Enable diagnostics for specified keys
	public enableDiagnostics(keys: string[]): void {
		this.disabledDiagnostics = this.disabledDiagnostics.filter(diag => !keys.includes(diag))
	}

	public parseNodes(document: string, bindingNames?: string[] | undefined, forceToXML?: boolean): Node[] {
		return parse(document, this, bindingNames, forceToXML)
	}

	public createDocument(nodes: Node[]): Document {
		return createDocument(nodes, this)
	}

	public parse(document: string, bindingNames?: string[] | undefined, forceToXML?: boolean): Document {
		return createDocument(parse(document, this, bindingNames, forceToXML), this)
	}

	public async compile(viewFilePath: string, document: Document): Promise<void> {
		viewFilePath = canonicalPath(viewFilePath)
		const compiler = new Compiler(viewFilePath)
		const { source, diagnostics: diags } = await compiler.compile(document)

		const kolintDiags = await Promise.all(diags.map(async diag => {
			if (diag.file && diag.start && diag.length) {
				const fileText = ts.sys.readFile(source.fileName + '.map')
				const sm = await new SourceMapConsumer(fileText ?? '')

				const generatedStart = ts.getLineAndCharacterOfPosition(diag.file, diag.start)
				const generatedEnd = ts.getLineAndCharacterOfPosition(diag.file, diag.start + diag.length)
				const start = sm.originalPositionFor({ line: generatedStart.line + 1, column: generatedStart.character })
				const end = sm.originalPositionFor({ line: generatedEnd.line + 1, column: generatedEnd.character })
				if (start.line !== null && end.line !== null && start.column !== null && end.column !== null) {
					const range = diag.start ? [diag.start, diag.start + diag.length] as const : [-1, -1] as const
					return new Diagnostic(diag, { range, coords: { first_line: start.line + 1, first_column: start.column, last_line: end.line + 1, last_column: end.column }})
				}
			}
			return new Diagnostic(diag, { range: [-1, -1], coords: { first_line: 0, first_column: 0, last_line: 0, last_column: 0 }})
		}))

		this.diagnostics = this.diagnostics.concat(kolintDiags)
	}
}
