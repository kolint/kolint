/** This file is deprecated. It is here just for reference while implementing all rules for the new parser infrastructure. */
import * as acorn from 'acorn'
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
	node: TreeNode
	expression: string
}

interface TreeNode extends acorn.Node {
	[key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function parseDataBind(data: string): Property[] | undefined {
	// TODO: type acorn node
	let tree: TreeNode // eslint-disable-line @typescript-eslint/no-explicit-any

	try {
		tree = acorn.parse(`({${data}})`)
	} catch (err) {
		return
	}

	/* eslint-disable @typescript-eslint/no-unsafe-assignment */
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	if (!tree.body || !tree.body[0] || !tree.body[0].expression?.properties) return

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const treeProperties = tree.body[0].expression.properties

	const properties: Property[] = []

	for (const property of treeProperties) {
		properties.push({
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expression: data.substring(property.value.start - 2, property.value.end - 2),
			node: property
		})
	}
	/* eslint-enable @typescript-eslint/no-unsafe-assignment */

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

export function parseBindingExpression(program: ProgramInternal, data: string, loc: Location): Binding[] {
	const properties = parseDataBind(data)
	const bindings: Binding[] = []

	if (!properties) {
		program._internal.addDiagnostic(new Diagnostic('javascript-syntax-error', loc))
		return []
	}

	for (const property of properties) {
		// TODO: bind variables to context (rewrite property names to include $data or $context)
		// (property: string) => property in $data ? `$data.${property}` : property in $context ? `$context.${property}` : --emitError--

		// Adjust for the two extra characters added during parsing.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const propertyRange = { start: property.node.value.start - 2, end: property.node.value.end - 2 }
		if (!(propertyRange.start && propertyRange.end))
			program._internal.addDiagnostic(new Diagnostic('javascript-syntax-error', loc, 'Expected expression.'))

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const identifier = property.node.key

		//		const propertyValue = data.substring(property.node.start-2, property.node.end)
		const binding = new Binding(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
