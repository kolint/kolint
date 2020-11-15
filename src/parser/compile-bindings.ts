/** This file is deprecated. It is here just for reference while implementing all rules for the new parser infrastructure. */
import * as meriyah from 'meriyah'
import { Diagnostic } from '../diagnostic'
import { getPosFromIndex as getPositionFromOffsetInFile } from '../utils'
import { Location } from './location'
import { Binding, BindingName, BindingExpression } from './bindingDOM'
import { ProgramInternal } from '../program'

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

function parseDataBind(data: string): Property[] | undefined {
	let tree: meriyah.ESTree.Program

	try {
		tree = meriyah.parse(`({${data}})`, {
			ranges: true,
			loc: true,
			raw: true,
			lexical: true
		})
	} catch (err) {
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
		.map<Property>(node => ({
			expression: data.substring((node.value.start ?? 0) - 2, (node.value.end ?? 0) - 2),
			node: node
		}))

	return properties
}

/**
 * Returns a new location relative to loc starting position.
 * @param data
 * @param loc
 * @param startOffset
 * @param endOffset
 */
function getRelativeLocation(data: string, loc: Location, startOffset: number, endOffset: number): Location {
	const startPosition = getPositionFromOffsetInFile(data, startOffset)
	const endPosition = getPositionFromOffsetInFile(data, endOffset)
	return {
		first_column: loc.first_column + startPosition.column,
		first_line: loc.first_line + startPosition.line,
		last_column: loc.first_column + endPosition.column,
		last_line: loc.first_line + endPosition.line,
		range: [loc.range[0] + startOffset, loc.range[1] + endOffset]
	}
}

export function parseBindingExpression(_: ProgramInternal, data: string, loc: Location): Binding[] {
	const properties = parseDataBind(data)
	const bindings: Binding[] = []

	if (!properties) {
		void _._internal.addDiagnostic(new Diagnostic('javascript-syntax-error', loc))
		return []
	}

	for (const property of properties) {
		// TODO: bind variables to context (rewrite property names to include $data or $context)
		// (property: string) => property in $data ? `$data.${property}` : property in $context ? `$context.${property}` : --emitError--

		// Adjust for the two extra characters added during parsing.
		const propertyRange = { start: property.node.value.start - 2, end: property.node.value.end - 2 }
		if (!(propertyRange.start && propertyRange.end))
			continue

		const identifier = property.node.key

		const binding = new Binding(
			new BindingName(property.node.key.name, getRelativeLocation(data, loc, identifier.start - 2, identifier.end - 2)),
			new BindingExpression(property.expression, getRelativeLocation(data, loc, propertyRange.start, propertyRange.end)))
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
