/** This file is deprecated. It is here just for reference while implementing all rules for the new parser infrastructure. */
import * as meriyah from 'meriyah'
import { Location } from './location'
import { Binding, BindingName, BindingExpression } from './bindingDOM'
import { Reporting } from '../program'
import { Diagnostic } from '../diagnostic'

export class ImportStatement {
	public isDefault = false

	public getValue(path: string): string {
		let result = ''

		if (this.isDefault) {
			result += `import ViewModel from '${path}'`
		} else if (this.name) {
			result += `import  { ${this.name} } from '${path}'`
			if (this.name !== 'ViewModel')
				result += `type ViewModel = ${this.name}`
		}

		return result
	}

	public constructor(public location: Location, public path: string, public name?: string) {
		this.isDefault = !name
	}
}

export function isParentBinding(binding: Binding): boolean {
	// TODO: find out properly if binding controls descendants
	return ['foreach', 'let', 'with', 'using'].includes(binding.bindingHandler.name)
}

interface Property {
	node: PropertyNode
	expression: string
}

interface PropertyNode extends meriyah.ESTree.Property {
	value: meriyah.ESTree.Property['value'] & {
		start: number
		end: number
	}
	key: meriyah.ESTree.Identifier & {
		start: number
		end: number
	}
}


interface ParseError extends SyntaxError {
	index: number
	line: number
	column: number
	description: string
}

function isParserError(err: unknown): err is ParseError {
	const _err = err as Record<string, unknown>

	return _err !== null && _err !== undefined &&
		typeof _err === 'object' &&
		typeof _err.index === 'number' &&
		typeof _err.line === 'number' &&
		typeof _err.column === 'number' &&
		typeof _err.description === 'string'
}

function parseDataBind(filePath: string, reporting: Reporting, data: string, loc: Location): Property[] | undefined {
	let tree: meriyah.ESTree.Program

	try {
		tree = meriyah.parse(`({${data}})`, {
			ranges: true,
			loc: true,
			raw: true,
			lexical: true
		})
	} catch (err) {
		if (isParserError(err))
			reporting.addDiagnostic(new Diagnostic(filePath, 'javascript-syntax-error', Object.assign({}, loc), 'Malformed binding expression'))
		return
	}

	if (tree.body.length !== 1)
		return

	const expressionStatement = tree.body[0]
	if (expressionStatement.type !== 'ExpressionStatement') return

	const objectExpression = expressionStatement.expression
	if (objectExpression.type !== 'ObjectExpression') return

	function isProperty(property: meriyah.ESTree.ObjectLiteralElementLike): property is PropertyNode {
		return property.type === 'Property' && property.value.start !== undefined && property.value.end !== undefined && property.key.start !== undefined && property.key.end !== undefined && property.key.type === 'Identifier'
	}

	const properties = objectExpression.properties
		.filter(isProperty)
		.map<Property>(node => {

			// Special treatment of 'foreach' bindings that returns objects on the form { data: <data>, as: <alias> }
			// This is not possible to handle in typescript until we get support for generic 'as const'
			const asProperty = node.value.type === 'ObjectExpression' && node.value.properties.filter(isProperty).find(propp => propp.key.name === 'as')
			let expression: string
			if (asProperty) {
				const injectionPoint = asProperty.value.start - 2
				expression = `${data.slice(node.value.start - 2, injectionPoint)}<const>${data.slice(injectionPoint, node.value.end - 2)}`
			} else
				expression = data.substring((node.value.start ?? 0) - 2, (node.value.end ?? 0) - 2)

			return {
				expression,
				node: node
			}})

	return properties
}

export function parseBindingExpression(filePath: string, reporting: Reporting, data: string, loc: Location): Binding[] {
	const properties = parseDataBind(filePath, reporting, data, loc)
	const bindings: Binding[] = []

	if (!properties)
		return []

	for (const property of properties) {
		// TODO: bind variables to context (rewrite property names to include $data or $context)
		// (property: string) => property in $data ? `$data.${property}` : property in $context ? `$context.${property}` : --emitError--

		const identifier = property.node.key
		const valueRange = property.node.value
		if (!(valueRange.start && valueRange.end))
			reporting.addDiagnostic(new Diagnostic(filePath, 'javascript-syntax-error', loc, 'Expected expression'))

		const [start] = loc.range
		// Adjust for the two extra characters added during parsing.
		const exprLoc: Location = {
			first_line: loc.first_line + (valueRange.loc?.start.line ?? 1) - 1,
			first_column: loc.first_column + (valueRange.loc?.start.column ?? 2) - 2,
			last_line: loc.first_line + (valueRange.loc?.end.line ?? 1) - 1,
			last_column: loc.last_column + (valueRange.loc?.end.column ?? 2) - 2,
			range: [start + valueRange.start - 2, start + valueRange.end - 2]
		}
		const identifierLoc: Location = {
			first_line: loc.first_line + (identifier.loc?.start.line ?? 1) - 1,
			first_column: loc.first_column + (identifier.loc?.start.column ?? 2) - 2,
			last_line: loc.first_line + (identifier.loc?.end.line ?? 1) - 1,
			last_column: loc.last_column + (identifier.loc?.end.column ?? 2) - 2,
			range: [start + identifier.start - 2, start + identifier.end - 2]
		}

		const binding = new Binding(
			new BindingName(property.node.key.name, identifierLoc),
			new BindingExpression(property.expression, exprLoc))
		bindings.push(binding)
	}

	return bindings
}


// // TODO: warn if there are multiple "ko-viewmodel" comments
// const statements: ImportStatement[] = []
// for (const childNode of NodeListToArray(dom.window.document.childNodes)) {
// 	if (childNode instanceof dom.window.Comment) {
// 		const location = getNodeLocation(dom, childNode)
// 		const importStatementParams = await parseImportStatementParameters(location, childNode)
// 		if (importStatementParams) {
// 			const start = getPosFromIndex(markup, location.startOffset + location.startCol)
// 			const end = getPosFromIndex(markup, location.startOffset + location.endCol)

// 			if (!(start && end)) continue

// 			statements.push(new ImportStatement({ start, end }, importStatementParams.path, importStatementParams.name))
// 		}
// 	}
// }

// return statements
