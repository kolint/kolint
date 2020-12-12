/** @type {import('../src').ConfigOptions} */
const config = {
	framework: (viewpath) => {
		return {
			viewmodels: [
				{
					path: './viewmodel',
					name: 'ViewModel',
					isTypeof: false
				}
			]
		}
	}
}

module.exports = config