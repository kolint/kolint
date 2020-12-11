const child_process = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('GENERATING JSON SCHEMA TO \'lib/config.schema.json\'...')

child_process.execSync('npx typescript-json-schema src/cli/cli.ts Config --noExtraProps --required --strictNullChecks --ignoreErrors --excludePrivate --out lib/config.schema.json', {
	cwd: path.join(__dirname, '..'),
	stdio: 'ignore'
})

console.log('GENERATING DOCS TO \'docs/guides/config.md\'...')

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/config.schema.json')).toString())

const tableItems = Object.entries(schema.properties)
	.map(([key, property]) =>
		`<tr><td>${key}</td><td><code>${property.type}</code></td><td>${property.description}</td><td>${property.default}</td></tr>`
	)
	.join('')

const table = `<!--\nTHIS FILE IS AUTO GENERATED\nSEE 'tools/gen-config-schema.js'\n-->\n<table><tr><th>name</th><th>type</th><th>description</th><th>default</th></tr>${tableItems}<table>`

fs.writeFileSync(path.join(__dirname, '../docs/guides/config.md'), table)
