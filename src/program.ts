import { createDocument, Document, Node, parse } from './parser'
import { Diagnostic } from './diagnostic'
import { Compiler, emit } from './compiler'
import * as ts from 'typescript'
import { SourceMapConsumer } from 'source-map'

export interface Reporting {
	addDiagnostic(...diags: Diagnostic[]): void
	disableAllDiagnostics(): void
	disableDiagnostics(keys: string[]): void
	enableAllDiagnostics(): void
	enableDiagnostics(keys: string[]): void
}

export interface TypeScriptCompiler {
	compile(viewFilePath: string, document: Document): Promise<TypeScriptCompilerEmit>
}

export interface TypeScriptCompilerEmit {
	rawSource: string
	sourceMap: string
	source: ts.SourceFile
	program: ts.Program
	service: ts.LanguageService
	getDiagnostics(): Diagnostic[]
}

export function createProgram(): Program {
	return new Program()
}

export class Program implements Reporting {
	private diagnostics: Diagnostic[] = []

	private allDiagnosticsDisabled = false
	private disabledDiagnostics = new Array<string>()

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

	public async compile(viewFilePath: string, document: Document): Promise<TypeScriptCompilerEmit> {
		const compiler = new Compiler(viewFilePath)
		const template = emit(viewFilePath, document)
		const generated = compiler.compile(template.file, 'generated.o.ts')
		const service = compiler.getService()
		const { program: tsprogram, source, path: generatedPath } = compiler.getSource('generated.o.ts')

		const sourceMap = await new SourceMapConsumer(template.sourceMap)

		function convertDiagnostics(diags: ts.Diagnostic[] | ts.DiagnosticWithLocation[]): Diagnostic[] {
			const diagnostics: Diagnostic[] = []
			for (const diag of diags) {
				if (diag.start && diag.length) {
					const generatedStart = ts.getLineAndCharacterOfPosition(source, diag.start)
					const generatedEnd = ts.getLineAndCharacterOfPosition(source, diag.start + diag.length)

					// TODO:...
					const start = sourceMap.originalPositionFor({
						line: generatedStart.line + 1,
						column: generatedStart.character
						//bias: SourceMapConsumer.LEAST_UPPER_BOUND
					})

					// Don't log error if the original position not exists
					if (start.line && start.column) {
						diagnostics.push(new Diagnostic(diag, {
							first_column: start.column + 1,
							first_line: start.line,
							last_column: start.column + 1 + (generatedEnd.character - generatedStart.character),
							last_line: start.line + (generatedEnd.line - generatedStart.line),
							range: []
						}))
					} else {
						// TODO: handle internal diagnostics
					}
				}
			}
			return diagnostics
		}

		return {
			rawSource: generated,
			sourceMap: template.sourceMap,
			source,
			service,
			program: tsprogram,
			getDiagnostics() {
				return convertDiagnostics(
					Array.from(ts.sortAndDeduplicateDiagnostics([
						...ts.getPreEmitDiagnostics(tsprogram, source),
						...service.getSuggestionDiagnostics(generatedPath)
					]))
				)
			}
		}
	}
}