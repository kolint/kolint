import * as utils from './utils'

describe('Document Builder', () => {
	// https://github.com/kolint/kolint/pull/281
	xit('Fails on unbalanced nodes', () => {
		utils.buildsDoesThrow('<div><div></div>')
	})
})
