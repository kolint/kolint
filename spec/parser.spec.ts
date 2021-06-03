import * as utils from './_utils'

describe('Parser', () => {
	// Common HTML

	it('Parses DOCTYPE', () => {
		utils.parsesDoesNotThrow('<!DOCTYPE html>')
	})

	it('Parses HTML/HEAD/BODY', () => {
		utils.parsesDoesNotThrow('<html><head></head><body></body></html>')
	})

	// Common XML/XHTML

	xit('Parses XMLPI (#285)', () => {
		utils.parsesDoesNotThrow('<?xml version="1.0" encoding="UTF-8"?>')
	})

	it('Parses XML namespace (#203)', () => {
		utils.parsesDoesNotThrow('<use xlink:href="#slack-tile">')
	})

	// Directives

	it('Parses default import', () => {
		utils.parsesDoesNotThrow('<!-- ko-import x from \'x\' -->')
	})

	it('Parses star import', () => {
		utils.parsesDoesNotThrow('<!-- ko-import * as x from \'x\' -->')
	})

	it('Parses named imports', () => {
		utils.parsesDoesNotThrow('<!-- ko-import { x, x } from \'x\' -->')
	})

	it('Parses default & named imports', () => {
		utils.parsesDoesNotThrow('<!-- ko-import x, { x, x } from \'x\' -->')
	})

	it('Parses viewmodel ref', () => {
		utils.parsesDoesNotThrow('<!-- ko-viewmodel x -->')
	})

	// Bindings

	it('Parses common binding', () => {
		utils.parsesDoesNotThrow('<div data-bind="key: value"></div>')
	})

	it('Parses multiple bindings', () => {
		utils.parsesDoesNotThrow('<div data-bind="key: value, key: value"></div>')
	})

	it('Parses javascript as binding value', () => {
		utils.parsesDoesNotThrow('<div data-bind="key: x ? { x: \'x\', x: () => {}, x: [] } : \'\'"></div>')
	})

	// Virtual Elements

	it('Parses virtual element comment', () => {
		utils.parsesDoesNotThrow('<!-- ko if: x --><!-- /ko -->')
	})

})
