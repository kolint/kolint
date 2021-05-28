import * as kolint from '..'
import * as assert from 'assert'

function parse(code: string) {
	let document = kolint.parse('inline', code, kolint.createProgram())
	// Serialize and parse to deep convert all classes to objects
	document = JSON.parse(JSON.stringify(document)) as typeof document
	return document
}

describe('Parser', () => {

	describe('Elements', () => {

		it('Normal tag', () => {
			assert.deepStrictEqual(
				parse('<div></div>'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 5,
							range: [0, 5]
						},
						key: 'div',
						nodeType: 0
					},
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 5,
							last_column: 11,
							range: [5, 11]
						},
						key: 'div',
						nodeType: 1
					}
				]
			)
		})

		it('Normal tag with text content', () => {
			assert.deepStrictEqual(
				parse('<div>content</div>'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 5,
							range: [0, 5]
						},
						key: 'div',
						nodeType: 0
					},
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 12,
							last_column: 18,
							range: [12, 18]
						},
						key: 'div',
						nodeType: 1
					}
				]
			)
		})

		it('Normal tag with child element', () => {
			assert.deepStrictEqual(
				parse('<div><span>content</span></div>'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 5,
							range: [0, 5]
						},
						key: 'div',
						nodeType: 0
					},
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 5,
							last_column: 11,
							range: [5, 11]
						},
						key: 'span',
						nodeType: 0
					},
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 18,
							last_column: 25,
							range: [18, 25]
						},
						key: 'span',
						nodeType: 1
					},
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 25,
							last_column: 31,
							range: [25, 31]
						},
						key: 'div',
						nodeType: 1
					}
				]
			)
		})

		it('Self closed tag', () => {
			assert.deepStrictEqual(
				parse('<img />'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 7,
							range: [0, 7]
						},
						key: 'img',
						nodeType: 2
					}
				]
			)
		})

		it('Self closed tag without / at end', () => {
			assert.deepStrictEqual(
				parse('<img>'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 5,
							range: [0, 5]
						},
						key: 'img',
						nodeType: 2
					}
				]
			)
		})

		it('Self closed tag with one attribute', () => {
			assert.deepStrictEqual(
				parse('<img src="./path/to" />'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 23,
							range: [0, 23]
						},
						key: 'img',
						nodeType: 2
					}
				]
			)
		})

		it('Self closed tag with one attribute without / at end', () => {
			assert.deepStrictEqual(
				parse('<img src="./path/to">'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 21,
							range: [0, 21]
						},
						key: 'img',
						nodeType: 2
					}
				]
			)
		})

		it('Tag with XML namespace (#203)', () => {
			assert.deepStrictEqual(
				parse('<use xlink:href="#slack-tile">'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 30,
							range: [0, 30]
						},
						key: 'use',
						nodeType: 0
					}
				]
			)
		})

	})

	describe('Virtual Elements', () => {

		it('Single-line comment', () => {
			assert.deepStrictEqual(
				parse('<!-- single-line comment test -->'),
				[]
			)
		})

		it('Multi-line comment', () => {
			assert.deepStrictEqual(
				parse('<!-- multi-line\ncomment\ntest -->'),
				[]
			)
		})

	})

	describe('Binding Elements', () => {

		it('Simple binding', () => {
			assert.deepStrictEqual(
				parse('<div data-bind="key: value"></div>'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 28,
							range: [0, 28]
						},
						key: 'div',
						nodeType: 0,
						bindings: [
							{
								location: {
									first_line: 1,
									last_line: 1,
									first_column: 15,
									last_column: 27,
									range: [16, 26]
								},
								bindingText: 'key: value'
							}
						]
					},
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 28,
							last_column: 34,
							range: [28, 34]
						},
						key: 'div',
						nodeType: 1
					}
				]
			)
		})

		it('Simple self-closing binding', () => {
			assert.deepStrictEqual(
				parse('<img data-bind="key: value">'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 0,
							last_column: 28,
							range: [0, 28]
						},
						key: 'img',
						nodeType: 2,
						bindings: [
							{
								location: {
									first_line: 1,
									last_line: 1,
									first_column: 15,
									last_column: 27,
									range: [16, 26]
								},
								bindingText: 'key: value'
							}
						]
					}
				]
			)
		})

	})

	describe('Import References', () => {

		it('Default import', () => {
			assert.deepStrictEqual(
				parse('<!-- ko-import vm from \'./viewmodel\' -->'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 15,
							last_column: 36,
							range: [15, 35]
						},
						key: '',
						nodeType: 2,
						importSymbols: [
							{
								name: {
									value: 'default',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 15,
										last_column: 17,
										range: [15, 17]
									}
								},
								alias: {
									value: 'vm',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 15,
										last_column: 17,
										range: [15, 17]
									}
								}
							}
						],
						modulePath: {
							value: './viewmodel',
							location: {
								first_line: 1,
								last_line: 1,
								first_column: 23,
								last_column: 36,
								range: [24, 35]
							}
						}
					}
				]
			)
		})

		it('Namespace import', () => {
			assert.deepStrictEqual(
				parse('<!-- ko-import * as viewmodel from \'./viewmodel\' -->'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 15,
							last_column: 48,
							range: [15, 47]
						},
						key: '',
						nodeType: 2,
						importSymbols: [
							{
								name: {
									value: '*',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 15,
										last_column: 16,
										range: [15, 16]
									}
								},
								alias: {
									value: 'viewmodel',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 20,
										last_column: 29,
										range: [20, 29]
									}
								}
							}
						],
						modulePath: {
							value: './viewmodel',
							location: {
								first_line: 1,
								last_line: 1,
								first_column: 35,
								last_column: 48,
								range: [36, 47]
							}
						}
					}
				]
			)
		})

		it('Named import', () => {
			assert.deepStrictEqual(
				parse('<!-- ko-import { vm } from \'./viewmodel\' -->'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 15,
							last_column: 40,
							range: [15, 39]
						},
						key: '',
						nodeType: 2,
						importSymbols: [
							{
								name: {
									value: 'vm',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 17,
										last_column: 19,
										range: [17, 19]
									}
								},
								alias: {
									value: 'vm',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 17,
										last_column: 19,
										range: [17, 19]
									}
								}
							}
						],
						modulePath: {
							value: './viewmodel',
							location: {
								first_line: 1,
								last_line: 1,
								first_column: 27,
								last_column: 40,
								range: [28, 39]
							}
						}
					}
				]
			)
		})

		it('Named imports', () => {
			assert.deepStrictEqual(
				parse('<!-- ko-import { vm, vm2 } from \'./viewmodel\' -->'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 15,
							last_column: 45,
							range: [15, 44]
						},
						key: '',
						nodeType: 2,
						importSymbols: [
							{
								name: {
									value: 'vm',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 17,
										last_column: 19,
										range: [17, 19]
									}
								},
								alias: {
									value: 'vm',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 17,
										last_column: 19,
										range: [17, 19]
									}
								}
							},
							{
								name: {
									value: 'vm2',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 21,
										last_column: 24,
										range: [21, 24]
									}
								},
								alias: {
									value: 'vm2',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 21,
										last_column: 24,
										range: [21, 24]
									}
								}
							}
						],
						modulePath: {
							value: './viewmodel',
							location: {
								first_line: 1,
								last_line: 1,
								first_column: 32,
								last_column: 45,
								range: [33, 44]
							}
						}
					}
				]
			)
		})

		it('Default and named imports', () => {
			assert.deepStrictEqual(
				parse('<!-- ko-import vm, { vm1, vm2 } from \'./viewmodel\' -->'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 15,
							last_column: 50,
							range: [15, 49]
						},
						key: '',
						nodeType: 2,
						importSymbols: [
							{
								name: {
									value: 'vm1',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 21,
										last_column: 24,
										range: [21, 24]
									}
								},
								alias: {
									value: 'vm1',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 21,
										last_column: 24,
										range: [21, 24]
									}
								}
							},
							{
								name: {
									value: 'vm2',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 26,
										last_column: 29,
										range: [26, 29]
									}
								},
								alias: {
									value: 'vm2',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 26,
										last_column: 29,
										range: [26, 29]
									}
								}
							},
							{
								name: {
									value: 'default',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 15,
										last_column: 17,
										range: [15, 17]
									}
								},
								alias: {
									value: 'vm',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 15,
										last_column: 17,
										range: [15, 17]
									}
								}
							}
						],
						modulePath: {
							value: './viewmodel',
							location: {
								first_line: 1,
								last_line: 1,
								first_column: 37,
								last_column: 50,
								range: [38, 49]
							}
						}
					}
				]
			)
		})


		it('Aliased imports', () => {
			assert.deepStrictEqual(
				parse('<!-- ko-import { vm as vm1, vm2 } from \'./viewmodel\' -->'),
				[
					{
						loc: {
							first_line: 1,
							last_line: 1,
							first_column: 15,
							last_column: 52,
							range: [15, 51]
						},
						key: '',
						nodeType: 2,
						importSymbols: [
							{
								name: {
									value: 'vm',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 17,
										last_column: 19,
										range: [17, 19]
									}
								},
								alias: {
									value: 'vm1',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 23,
										last_column: 26,
										range: [23, 26]
									}
								}
							},
							{
								name: {
									value: 'vm2',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 28,
										last_column: 31,
										range: [28, 31]
									}
								},
								alias: {
									value: 'vm2',
									location: {
										first_line: 1,
										last_line: 1,
										first_column: 28,
										last_column: 31,
										range: [28, 31]
									}
								}
							}
						],
						modulePath: {
							value: './viewmodel',
							location: {
								first_line: 1,
								last_line: 1,
								first_column: 39,
								last_column: 52,
								range: [40, 51]
							}
						}
					}
				]
			)
		})

	})

})
