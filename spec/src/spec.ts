import * as lint from '../../build'

const parseTests = {
	tag: [
		[
			'Normal tag',
			'<div></div>'
		],
		[
			'Normal tag with text content',
			'<div>content</div>'
		],
		[
			'Normal tag with child element',
			'<div><span>content</span></div>'
		],
		[
			'Self closed tag',
			'<img />'
		],
		[
			'Self closed tag without / at end',
			'<img>'
		],
		[
			'Self closed tag with one attribute',
			'<img src="./path/to" />'
		],
		[
			'Self closed tag with one attribute without / at end',
			'<img src="./path/to">'
		]
	],

	viewModelImport: [
		[
			'Shorthand syntax for default',
			'<!-- ko-viewmodel: \'./viewmodel\' -->'
		],
		[
			'Default import',
			'<!-- ko-viewmodel: import default from \'./viewmodel\' -->'
		],
		[
			'Normal import',
			'<!-- ko-viewmodel: import viewmodel from \'./viewmodel\' -->'
		],
		[
			'export=/star import',
			'<!-- ko-viewmodel: import * from \'./viewmodel\' -->'
		]
	],

	bindingHandlerImport: [
		[
			'Default import',
			'<!-- ko-bindinghandler: import bindinghandler from \'./bindinghandler\' -->'
		],
		[
			'Normal import',
			'<!-- ko-bindinghandler: import { bindinghandler } from \'./bindinghandler\' -->'
		],
		[
			'Normal import with additional comma',
			'<!-- ko-bindinghandler: import { bindinghandler, } from \'./bindinghandler\' -->'
		],
		[
			'As import',
			'<!-- ko-bindinghandler: import { bindinghandler1 as bindinghandler } from \'./bindinghandler\' -->'
		],
		[
			'export=/star import',
			'<!-- ko-bindinghandler: import * as bindinghandler from \'./bindinghandler\' -->'
		]
	]
}

let correctPositionEmitCache: lint.Diagnostic[] = []
// Do not change this unsless you know what you are doing!
const emitTestString = '<!-- ko-viewmodel: import default from \'nothing2\' -->\n<img data-bind="test: undefined">\n<img data-bind="text: notdefined">'

const compilerTests: ([string, (program: lint.Program) => Promise<string | true>, string] | [string, (program: lint.Program) => Promise<string | true>])[] = [
	[
		'Correct start and end positions (import)',

		async (program: lint.Program) => {
			const emit = await program.typescriptCompiler.compile('nothing1', program.parse(emitTestString))

			const diags = correctPositionEmitCache = emit.getDiagnostics()

			return (diags.length === 3 &&
			diags[0].location?.first_column === 40 && diags[0].location?.last_column === 50 &&
			diags[0].location?.first_line === 1 && diags[0].location?.last_line === 1) ||
			'Invalid start and end positions'
		},
		'https://github.com/knockout-lint/knockout-lint/issues/58'
	],
	[
		'Correct start and end positions (binding handler)',

		async () => {
			const diags = correctPositionEmitCache

			return (diags.length === 3 &&
			diags[1].location?.first_column === 17 && diags[1].location?.last_column === 23 &&
			diags[1].location?.first_line === 2 && diags[1].location?.last_line === 2) ||
			'Invalid start and end positions'
		}
	],
	[
		'Correct start and end positions (expression)',

		async () => {
			const diags = correctPositionEmitCache

			return (diags.length === 3 &&
			diags[2].location?.first_column === 23 && diags[2].location?.last_column === 33 &&
			diags[2].location?.first_line === 3 && diags[2].location?.last_line === 3) ||
			'Invalid start and end positions'
		}
	],
]

//#region Run tests

let latestCategory: string | undefined

function color(code: number): string {
	return `\x1b[${code}m`
}

function logCategoryIfNeeded(category: string) {
	if (latestCategory !== category) {
		latestCategory = category
		console.log(`\n    ${category}`)
	}
}

function success(category: string, name: string) {
	logCategoryIfNeeded(category)

	console.log(`        ${color(92)}✓${color(0)} ${name}`)
}

function warn(category: string, name: string, issue: string, error: string) {
	logCategoryIfNeeded(category)

	console.log(`        ${color(33)}⚠${color(0)} ${name}\n${color(90)}${error.split('\n').map(line => `            ${line}`).join('\n')}${color(0)}\n            ${color(90)}> ${color(4)}${issue}${color(0)}`)
}

let hasErrors = false
function error(category: string, name: string, error: string) {
	logCategoryIfNeeded(category)

	hasErrors = true

	console.log(`        ${color(31)}✗${color(0)} ${name}\n${color(90)}${error.split('\n').map(line => `            ${line}`).join('\n')}${color(0)}`)
}

function test(category: string, name: string, issue: string | undefined, expression: () => true | string) {
	try {
		_test(category, name, issue, expression())
	} catch (err) {
		_fail(category, name, issue, err)
	}
}

async function testAsync(category: string, name: string, issue: string | undefined, expression: () => Promise<true | string>) {
	try {
		_test(category, name, issue, await expression())
	} catch (err) {
		_fail(category, name, issue, err)
	}
}

function _test(category: string, name: string, issue: string | undefined, result: true | string) {
	if (result === true) {
		if (issue)
			return void error(category, name, 'The test succeeded with an assigned issue')

		success(category, name)
	}
	else if (issue)
		warn(category, name, issue, result)
	else
		error(category, name, result)
}

function _fail(category: string, name: string, issue: string | undefined, err: any) {
	if (err instanceof Error) {
		if (issue)
			return warn(category, name, issue, err.stack ?? err.message)

		error(category, name, err.stack ?? err.message)
	} else if (err instanceof lint.Diagnostic) {
		error(category, name, err.message)
	} else {
		const toStringErr = typeof err === 'object' && typeof err.toString === 'function' ? err.toString() : undefined
		const forcedStringErr = typeof toStringErr === 'string' ? toStringErr : String(err)

		if (issue)
			return warn(category, name, issue, forcedStringErr)

		error(category, name, forcedStringErr)
	}
}

const program = lint.createProgram()

for (const [name, subject, issue] of parseTests.tag) {
	test('Tag', name, issue, () => program.parseNodes(subject)?.length > 0 || 'Parsed nodes length were 0')
}

for (const [name, subject, issue] of parseTests.viewModelImport) {
	test('View Model Import', name, issue, () => program.parseNodes(subject)?.length > 0 || 'Parsed nodes length were 0')
}

for (const [name, subject, issue] of parseTests.bindingHandlerImport) {
	test('Binding Handler Import', name, issue, () => program.parseNodes(subject)?.length > 0 || 'Parsed nodes length were 0')
}

; (async () => {
	for (const [name, compilerTest, issue] of compilerTests) {
		await testAsync('TypeScript Compiler', name, issue, async () => await compilerTest(lint.createProgram()))
	}

	console.log('')

	if (hasErrors)
		process.exit(1)
})()

//#endregion Run tests
