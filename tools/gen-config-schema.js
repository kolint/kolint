const child_process = require('child_process')
const fs = require('fs')
const path = require('path')

const isdocs = -1 === process.argv.indexOf('--no-docs')
const isschema = -1 === process.argv.indexOf('--no-schema')
const isoverride = -1 === process.argv.indexOf('--no-override')
const help = -1 !== process.argv.indexOf('--help')

const schemaPath = path.join(__dirname, '../lib/config.schema.json')
const docsPath = path.join(__dirname, '../docs/guides/config.md')

if (!isoverride) {
	if (isdocs && fs.existsSync(docsPath))
		process.exit(0)
	if (isschema && fs.existsSync(schemaPath))
		process.exit(0)
}

if (help) {
	console.log('node tools/gen-config-schema.js [--help, --no-docs, --no-schema, --no-override]')

	process.exit(0)
}

if (!isdocs && !isschema)
	console.log('--no-schema and --no-docs?')

console.log('Generating KOLint json schema to \'lib/config.schema.json\'...')

const _schema = child_process.execSync('node ./node_modules/typescript-json-schema/bin/typescript-json-schema src/cli/cli.ts ConfigOptions --noExtraProps --required --strictNullChecks --ignoreErrors --excludePrivate', {
	cwd: path.join(__dirname, '..'),
	shell: true,
	windowsHide: false
}).toString()
const schema = JSON.parse(_schema)

if (isschema)
	fs.writeFileSync(schemaPath, _schema.replace(/^\{\n\s*/, '{\n    "$comment": "THIS FILE IS AUTO GENERATED. THIS FILE SHOULD !!NOT!! BE COMMITED. SEE \'tools/gen-config-schema.js\'",\n    '))

if (isdocs) {
	console.log('GENERATING DOCS TO \'docs/guides/config.md\'...')

	const tableItems = Object.entries(schema.properties)
		.map(([key, property]) =>
			`<tr><td>${key}</td><td><code>${property.type}</code></td><td>${property.description}</td><td><code>${property.default}</code></td></tr>`
		)
		.join('')

	const table = `<!--\nTHIS FILE IS AUTO GENERATED\nTHIS FILE !!SHOULD!! BE COMMITED\nSEE 'tools/gen-config-schema.js'\n-->\n<table><tr><th>name</th><th>type</th><th>description</th><th>default</th></tr>${tableItems}<table>`

	fs.writeFileSync(docsPath, table)
}
