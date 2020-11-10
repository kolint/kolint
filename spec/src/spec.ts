import * as lint from '../../build'

const tests = {
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

function warn(category: string, name: string, issue: string) {
	logCategoryIfNeeded(category)

	console.log(`        ${color(33)}⚠${color(0)} ${name}\n            ${color(90)}${color(4)}${issue}${color(0)}`)
}

let hasErrors = false
function error(category: string, name: string, error: string) {
	logCategoryIfNeeded(category)

	hasErrors = true

	console.log(`        ${color(31)}✗${color(0)} ${name}\n${color(90)}${error.split('\n').map(line => `            ${line}`).join('\n')}${color(0)}`)
}

function test(category: string, name: string, issue: string | undefined, expression: () => boolean) {
	try {
		if (expression()) {
			if (issue)
				return void error(category, name, 'The test succeeded with an assigned issue')

			success(category, name)
		}
		else if (issue)
			warn(category, name, issue)
		else
			error(category, name, 'Parsed nodes length were 0')
	} catch (err) {
		if (err instanceof Error) {
			if (issue)
				return warn(category, name, issue)

			error(category, name, err.stack ?? err.message)
		} else {
			if (issue)
				return warn(category, name, issue)

			const _err = typeof err === 'object' && typeof err.toString === 'function' ? err.toString() : undefined
			error(category, name, typeof _err === 'string' ? _err : String(err))
		}
	}
}

const program = lint.createProgram()

// Causes vscode's code coloring to mess up without semi
// eslint-disable-next-line semi
type Tests = [string, string, string | undefined][];

for (const [name, subject, issue] of tests.tag as Tests)
	test('Tag', name, issue, () => program.parseNodes(subject)?.length > 0)

for (const [name, subject, issue] of tests.viewModelImport)
	test('View Model Import', name, issue, () => program.parseNodes(subject)?.length > 0)

for (const [name, subject, issue] of tests.bindingHandlerImport)
	test('Binding Handler Import', name, issue, () => program.parseNodes(subject)?.length > 0)

console.log('')

if (hasErrors)
	process.exit(1)

//#endregion Run tests
