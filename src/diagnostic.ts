import * as ts from 'typescript'
import { Location } from './parser/location'

interface TsDiagnostics {
	code: number
	category: ts.DiagnosticCategory
	key: string
	message: string
	reportsUnnecessary: boolean | undefined
	elidedInCompatabilityPyramid: boolean | undefined
}

function getTsDiagnostics(): TsDiagnostics[] {
	const Diagnostics = (ts as Record<string, unknown>).Diagnostics as Record<string, TsDiagnostics>

	return Object.keys(Diagnostics).map(key => Diagnostics[key])
}

const tsDiagnostics: TsDiagnostics[] = getTsDiagnostics()

function prefix(index: number): string {
	return `KO${'0000'.substr(0, 4 - index.toString().length)}${index}`
}

export enum Severity {
	Off = 1,
	Warning,
	Error
}

export class Diagnostic {
	public code: string
	public message: string
	public name: string
	public severity: Severity

	public constructor(public filePath: string, diagnostic: DiagnosticDescription | ts.Diagnostic | keyof typeof diagnostics, public location?: Location, ...args: string[]) {
		if (typeof diagnostic === 'string') {
			let diag: DiagnosticDescription

			if (diagnostic in diagnostics)
				diag = diagnostics[diagnostic]
			else
				throw new Error(`${diagnostic} is not a valid diagnostics`)

			this.code = diag.code
			this.message = diag.message
			this.name = diagnostic
		} else if ('messageText' in diagnostic) {
			const messageText = typeof diagnostic.messageText === 'object' ? diagnostic.messageText.messageText : diagnostic.messageText
			this.code = `TS${diagnostic.code}`
			this.message = messageText

			const key = tsDiagnostics.find(diag => diag.code === diagnostic.code)?.key

			if (!key) throw new Error('Unable to find key')

			this.name = key
		} else {
			this.message = diagnostic.message
			this.code = diagnostic.code
			this.name = diagnostic.code.toString()
		}

		let index = 0
		for (const arg of args) {
			this.message = this.message.replace(new RegExp('\\$' + index.toString(), 'g'), arg)
			index++
		}

		this.severity = Severity.Error
	}
}

export function setProblemsSeverity(problems: Diagnostic[], diagnosticSeverity: { [key in string]?: Severity }): Diagnostic[] {
	return problems.map(problem => {
		problem.severity = diagnosticSeverity[problem.code] ?? problem.severity
		return problem
	})
}

export interface DiagnosticDescription {
	code: string
	message: string
}

interface DiagnosticSpecification {
	code: string
	message: string
	arguments?: readonly string[]
}

/* eslint-disable-next-line */
export const diagnostics = (<K extends string>(a: Record<K, DiagnosticSpecification>) => a)({
	'multiple-context-bindings': {
		code: prefix(1),
		message: 'Only one binding-handler per element can create child contexts. Move [$0] into separate elements.',
		arguments: [ '$0' ] as const
	},
	'no-viewmodel-reference': {
		code: prefix(2),
		message: 'Missing Viewmodel reference'
	},
	'multiple-comment-bindings': {
		code: prefix(3),
		message: 'Can not have multiple bindings in the same comment.'
	},
	'javascript-syntax-error': {
		code: prefix(4),
		message: 'Syntax error: $0.',
		arguments: [ '$0' ] as const
	},
	'could-not-find-viewmodel': {
		code: prefix(5),
		message: 'Could not find viewModel.'
	},
	'missing-end-of-virtual-element': {
		code: prefix(6),
		message: 'Missing the end of the virtual element.'
	},
	'missing-start-of-virtual-element': {
		code: prefix(7),
		message: 'Missing the start of the virtual element.'
	},
	'virtual-element-start-and-end-not-on-same-depth': {
		code: prefix(8),
		message: 'The virtual element\'s start and end was not on the same level.'
	},
	'virtual-element-prefix-required': {
		code: prefix(9),
		message: 'The virtual element is required to have a prefix.'
	},
	'unbalanced-start-end-tags': {
		code: prefix(10),
		message: 'Unbalanced start and/or end tags results in incomplete tree.'
	},
	'can-not-find-knockout': {
		code: prefix(11),
		message: 'Can not find dependency knockout.'
	},
	'binding-context-unknown': {
		code: prefix(12),
		message: 'Unknown type of binding context'
	},
	'binding-context-any': {
		code: prefix(13),
		message: 'Binding context is of type \'any\''
	},
	'parser-error': {
		code: prefix(14),
		message: 'Expected $0, got "$1" ($2).',
		arguments: [ '$0', '$1', '$2' ] as const
	},
	'multiple-context-generating-bindings': {
		code: prefix(15),
		message: 'Multiple context generating bindings in same node are not allowed.'
	},
	'binding-unknown': {
		code: prefix(16),
		message: 'Type unknown for binding handler \'$0\'.',
		arguments: [ '$0' ] as const
	}
})
