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
		],
		[
			'Tag with XML namespace (#203)',
			'<use xlink:href="#slack-tile">'
		]
	],

	virtual: [
		[
			'Multi-line comment',
			'<!-- whatever we would like to\nwrite -->'
		]
	],

	bindings: [
		[
			'key: value',
			'<div data-bind="key: value"></div>\n<img data-bind="key: value">'
		],
		[
			'key_value',
			'<div data-bind="key_value"></div>\n<img data-bind="key_value">'
		]
	],

	import: [
		[
			'Default import',
			'<!-- ko-import vm from \'./viewmodel\' -->'
		],
		[
			'Namespace import',
			'<!-- ko-import * as viewmodel from \'./viewmodel\' -->'
		],
		[
			'Named import',
			'<!-- ko-import { vm } from \'./viewmodel\' -->'
		],
		[
			'Named imports',
			'<!-- ko-import { vm, vm2 } from \'./viewmodel\' -->'
		],
		[
			'Default and named imports',
			'<!-- ko-import vm, { vm1, vm2 } from \'./viewmodel\' -->'
		],
		[
			'Aliased imports',
			'<!-- ko-import { vm as vm1, vm2 } from \'./viewmodel\' -->'
		]
	],

	contextModification: [
		[
			'Create child context from object reference',
			'<!-- ko-viewmodel typeof vm -->'
		],
		[
			'Create child context from type reference',
			'<!-- ko-viewmodel vm -->'
		],
		[
			'Change current context to parent context',
			'<!-- ko-context current.$parentContext -->'
		],
		[
			'Change current context to parent context',
			'<!-- ko-context current.$parentContext.$parentContext -->'
		],
		[
			'Change current context to named context',
			'<!-- ko-context root -->'
		],
	]
}

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

function _fail(category: string, name: string, issue: string | undefined, err: unknown) {
	if (err instanceof Error) {
		if (issue)
			return warn(category, name, issue, err.stack ?? err.message)

		error(category, name, err.stack ?? err.message)
	} else if (err instanceof lint.Diagnostic) {
		error(category, name, err.message)
	} else {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const toStringErr = typeof err === 'object' && typeof err?.toString === 'function' ? err.toString() : undefined
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

for (const [name, subject, issue] of parseTests.virtual) {
	test('Virtual Elements', name, issue, () => program.parseNodes(subject)?.length === 0 || 'Unexpected number of nodes')
}

for (const [name, subject, issue] of parseTests.bindings) {
	test('Bindings', name, issue, () => program.parseNodes(subject)?.length > 0 || 'Parsed nodes length were 0')
}

for (const [name, subject, issue] of parseTests.import) {
	test('Import', name, issue, () => program.parseNodes(subject)?.length > 0 || 'Parsed nodes length were 0')
}

for (const [name, subject, issue] of parseTests.contextModification) {
	test('Context modifications', name, issue, () => program.parseNodes(subject)?.length > 0 || 'Parsed nodes length were 0')
}

if (hasErrors)
	process.exit(1)
