import { Document, Node } from './parser/syntax-tree'
import { Diagnostic } from './diagnostic'
import { Compiler } from './compiler/compiler'
import { SourceMapGenerator } from 'source-map'
import { parse } from './parser/parser'

export interface Reporting {
	registerOutput(filename: string, code: string, map: SourceMapGenerator): void
	addDiagnostic(...diags: Diagnostic[]): void
	disableAllDiagnostics(): void
	disableDiagnostics(keys: string[]): void
	enableAllDiagnostics(): void
	enableDiagnostics(keys: string[]): void
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

	public registerOutput(filename: string, code: string, map: SourceMapGenerator): void {
		/* TODO: Implement this */
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
		await compiler.compile(documents, this)
		return this.diagnostics
	}
}
