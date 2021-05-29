const TYPESCRIPT_FILENAME = 'src/cli/index.ts'
const TYPE_NAME = 'ConfigOptions'
const MARKDOWN_FILENAME = 'docs/guides/configuring.md'
const TABLE_CLOSURE_COMMENTS = ['<!-- CONFIG TABLE START -->', '<!-- CONFIG TABLE END -->']




const fs = require('fs')
const path = require('path')
const tjs = require('typescript-json-schema')

const program = tjs.getProgramFromFiles([
	path.resolve(TYPESCRIPT_FILENAME)
])

const schema = tjs.generateSchema(program, TYPE_NAME, {
	noExtraProps: true,
	required: true,
	strictNullChecks: true,
	ignoreErrors: true,
	excludePrivate: true
})

const properties = Object.entries(schema.properties).sort(([a], [b]) => a > b ? 1 : a < b ? -1 : 0)

const table = [
	`\n\n| name | type | description | default |`,
	`| :- | :- | :- | :- |`,
	properties.map(([key, property]) => `| \`${key}\` | \`${property.type}\` | ${property.description} | \`${property.default}\` |`).join('\n'),
	''
].join('\n')

let markdown = fs.readFileSync(MARKDOWN_FILENAME, 'utf-8')

markdown.replace(
	new RegExp(`${TABLE_CLOSURE_COMMENTS[0]}.+${TABLE_CLOSURE_COMMENTS[1]}`),
	`${TABLE_CLOSURE_COMMENTS[0]}${table}${TABLE_CLOSURE_COMMENTS[1]}`
)

fs.writeFileSync(MARKDOWN_FILENAME, table)
