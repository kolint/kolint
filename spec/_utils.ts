import * as assert from 'assert'
import * as kolint from '..'

function parse(content: string) {
	const program = kolint.createProgram()
	return program.parseNodes('inline', content)
}

function build(content: string) {
	const program = kolint.createProgram()
	const nodes = program.parseNodes('inline', content)
	return kolint.createDocument('inline', nodes, program)
}

function jsonify<T>(v: T): T {
	return JSON.parse(JSON.stringify(v)) as T
}

function check(value: unknown, expected: unknown, alwaysCheck: boolean) {
	if (expected || alwaysCheck) {
		const doc = jsonify(value)
		assert.deepStrictEqual(doc, expected)
	}
}

export function buildsDoesNotThrow(content: string, expected?: unknown, alwaysCheck = false) {
	assert.doesNotThrow(() => check(build(content), expected, alwaysCheck))
}

export function buildsDoesThrow(content: string, expected?: unknown, alwaysCheck = false) {
	assert.doesNotThrow(() => check(build(content), expected, alwaysCheck))
}

export function parsesDoesThrow(content: string, expected?: unknown, alwaysCheck = false) {
	assert.doesNotThrow(() => check(parse(content), expected, alwaysCheck))
}

export function parsesDoesNotThrow(content: string, expected?: unknown, alwaysCheck = false) {
	assert.doesNotThrow(() => check(parse(content), expected, alwaysCheck))
}
