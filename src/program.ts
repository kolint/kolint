import { createDocument, Document, Node, parse } from './parser'
import { Diagnostic } from './diagnostic'
import { Compiler, emit } from './compiler';
import * as ts from 'typescript'
import { SourceMapConsumer } from 'source-map'

export interface Internal {
	disableAllDiagnostics: boolean
	disabledDiagnostics: string[]
	addDiagnostic(...diags: Diagnostic[]): void
}

export interface ProgramInternal extends Program {
	_internal: Internal
}

export interface Program {
	diagnostics: Diagnostic[]
	getDiagnostics(): Diagnostic[]
	parseNodes(document: string, bindingNames?: string[] | undefined, forceToXML?: boolean): Node[]
	createDocument(nodes: Node[]): Document
	parse(document: string, bindingNames?: string[] | undefined, forceToXML?: boolean): Document
	typescriptCompiler: TypeScriptCompiler
}

export interface TypeScriptCompiler {
	compile(viewFilePath: string, document: Document): Promise<TypeScriptCompilerEmit>
}

export interface TypeScriptCompilerEmit {
	rawSource: string;
	sourceMap: string;
	source: ts.SourceFile;
	program: ts.Program
	service: ts.LanguageService
	getDiagnostics(): Diagnostic[]
}

export function createProgram(): Program {
	let diagnostics: Diagnostic[] = []

	return new class implements Program {
		private _internal = {
			disableAllDiagnostics: false,
			disabledDiagnostics: new Array<string>(),
			addDiagnostic: (...diags: Diagnostic[]): void => {
				if (this._internal.disableAllDiagnostics) return
				for (const diag of diags)
					if (this._internal.disabledDiagnostics.includes(diag.code) || this._internal.disabledDiagnostics.includes(diag.name)) return
				diagnostics = diagnostics.concat(diags)
			}
		}

		public get diagnostics() {
			return diagnostics
		}

		public getDiagnostics() {
			return diagnostics
		}

		parseNodes(document: string, bindingNames?: string[] | undefined, forceToXML?: boolean): Node[] {
			return parse(document, this, bindingNames, forceToXML)
		}

		createDocument(nodes: Node[]): Document {
			return createDocument(nodes, this as unknown as ProgramInternal)
		}

		parse(document: string, bindingNames?: string[] | undefined, forceToXML?: boolean): Document {
			return createDocument(parse(document, this, bindingNames, forceToXML), this as unknown as ProgramInternal)
		}

		typescriptCompiler = {
			async compile(viewFilePath: string, document: Document): Promise<TypeScriptCompilerEmit> {
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
	}
}