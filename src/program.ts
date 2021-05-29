import { Document, Node } from './parser/syntax-tree'
import { Diagnostic } from './diagnostic'
import { Compiler } from './compiler'
import { SourceMapGenerator } from 'source-map'
import { parse } from './parser'

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

	private diagnosticsDisabled = false
	private disabledDiagnostics: string[] = []
	private enabledDiagnostics: string[] = []

	private diagIsRule(rules: string[], diag: Diagnostic) {
		return rules.includes(diag.code) || rules.includes(diag.name)
	}

	public addDiagnostic(...diags: Diagnostic[]): void {
		if (this.diagnosticsDisabled) {
			this.diagnostics = this.diagnostics.concat(
				diags.filter(diag => this.diagIsRule(this.enabledDiagnostics, diag))
			)
		} else {
			this.diagnostics = this.diagnostics.concat(
				diags.filter(diag => !this.diagIsRule(this.disabledDiagnostics, diag))
			)
		}
	}

	public registerOutput(filename: string, code: string, map: SourceMapGenerator): void {
		/* TODO: Implement this */
	}

	// Disable all diags
	public disableAllDiagnostics(): void {
		this.diagnosticsDisabled = true
		this.enabledDiagnostics = []
	}

	// Disable diags for keys
	public disableDiagnostics(keys: string[]): void {
		if (this.diagnosticsDisabled) {
			this.enabledDiagnostics = this.enabledDiagnostics.filter(diag => !keys.includes(diag))
		} else {
			this.disabledDiagnostics = this.disabledDiagnostics.concat(keys)
		}
	}

	// Enable all diagnostics
	public enableAllDiagnostics(): void {
		this.diagnosticsDisabled = false
		this.disabledDiagnostics = []
	}

	// Enable diagnostics for specified keys
	public enableDiagnostics(keys: string[]): void {
		if (this.diagnosticsDisabled) {
			this.enabledDiagnostics = this.enabledDiagnostics.concat(keys)
		} else {
			this.disabledDiagnostics = this.disabledDiagnostics.filter(diag => !keys.includes(diag))
		}
	}

	public parseNodes(filePath: string, document: string, bindingNames?: string[] | undefined, forceToXML?: boolean): Node[] {
		return parse(filePath, document, this, bindingNames, forceToXML)
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
