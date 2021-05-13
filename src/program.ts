import { Document, Node, parse } from './parser'
import { Diagnostic } from './diagnostic'
import { Compiler } from './compiler'
import * as ts from 'typescript'
import { SourceMapConsumer } from 'source-map'

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
		this.diagnostics.push(...diags)
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

	/**
	 * Creates a pre-compiled view from the input view. Used for type checking.
	 * @param document the tree of bindings for the view
	 * @returns the file path to the generated compiled view
	 */
	public async compile(documents: Document[]): Promise<Diagnostic[]> {
		const compiler = new Compiler()
		const { diagnostics: diags } = compiler.compile(documents, this)

		// TODO: Group all diags on diag.file.fileName and do source map lookups first.
		const kolintDiags = await Promise.all(diags.map(async diag => {
			const filename = diag.file?.fileName ?? ''
			if (diag.file && diag.start) {
				const generatedStart = ts.getLineAndCharacterOfPosition(diag.file, diag.start)
				const generatedEnd = ts.getLineAndCharacterOfPosition(diag.file, diag.start + (diag.length ?? 0) - 1)

				const sourceMapFile = ts.sys.readFile(filename + '.map')
				if (sourceMapFile) {
					const sm = await new SourceMapConsumer(sourceMapFile)
					const start = sm.originalPositionFor({ line: generatedStart.line + 1, column: generatedStart.character })
					const end = sm.originalPositionFor({ line: generatedEnd.line + 1, column: generatedEnd.character })
					const sourceName = start.source ?? filename
					if (start.line !== null && end.line !== null && start.column !== null && end.column !== null) {
						const range = diag.start ? [diag.start, diag.start + (diag.length ?? 0)] as const : [-1, -1] as const
						return new Diagnostic(sourceName, diag, { first_line: start.line, first_column: start.column + 1, last_line: end.line, last_column: end.column + 1, range: [range[0], range[1]] })
					}
				}
				const range = diag.start ? [diag.start, diag.start + (diag.length ?? 0)] as const : [-1, -1] as const
				return new Diagnostic(filename, diag, { first_line: generatedStart.line + 1, first_column: generatedStart.character, last_line: generatedEnd.line + 1, last_column: generatedEnd.character, range: [range[0], range[1]] })
			}
			return new Diagnostic(filename, diag, { first_line: 0, first_column: 0, last_line: 0, last_column: 0, range: [-1, -1] })
		}))

		this.diagnostics.push(...kolintDiags)
		return this.diagnostics
	}
}
