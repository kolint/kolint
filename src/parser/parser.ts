import * as documentParser from '../../lib/document-parser'
import { Location } from './location'
import { ViewModelNode, Node, NodeType, BindingData, DiagNode, BindingHandlerImportNode, IdentifierNode } from './bindingDOM'
import { Program } from '../program'

const selfClosingNodeNames = [
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'iframe',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
	'command',
	'keygen',
	'menuitem'
]

// Make sure self-closed tags are cleaned up and that they are empty
// This function is executed for HTML documents. Not applicable on XML.
function transformSelfClosingNodes(ast: Node[]): void {
	for (let pos = ast.length - 1; pos >= 0; --pos) {
		const node = ast[pos]
		if (node.type === NodeType.Empty)
			continue
		if (selfClosingNodeNames.includes(node.key)) {
			switch (node.type) {
				case NodeType.Start:
					node.type = NodeType.Empty
					break
				case NodeType.End:
					// TODO: problem warning when manually closing self-closed tags (might not behave as intended if they use bindings inside self-closed tags)
					ast.splice(pos, 1) // Delete closed
					break
			}
		}
	}
}

/**
 * The shared values between the jison lexer/parser and the viewParser.
 */
export class YY {
	public createViewRefNode = (location: Location, modulePath: string, modulePathLoc: Location, isTypeof: boolean, name?: string): ViewModelNode => {
		return new ViewModelNode(location, new IdentifierNode(modulePath, modulePathLoc), isTypeof, name)
	}

	public createBindingHandlerRefNode = (loc: Location, modulePath: string, modulePathLoc: Location, names: Record<string, { isTypeof: boolean, value: string }>): BindingHandlerImportNode => {
		return new BindingHandlerImportNode(loc, new IdentifierNode(modulePath, modulePathLoc), names)
	}

	public createStartNode = (loc: Location, key: string): Node => {
		return new Node(loc, key, NodeType.Start)
	}

	public createEndNode = (loc: Location, key: string): Node => {
		return new Node(loc, key, NodeType.End)
	}

	public createEmptyNode = (loc: Location, key: string): Node => {
		return new Node(loc, key, NodeType.Empty)
	}

	public createBindingData = (loc: Location, data: string): BindingData => {
		return new BindingData(loc, data)
	}

	public createDiagNode = (loc: Location, keys: string[], enable: boolean): DiagNode => {
		return new DiagNode(loc, keys, enable)
	}

	public bindingNames = this._bindingNames ?? ['data-bind']

	public constructor(private _bindingNames: string[]) { }
}

/**
 * Parse raw HTML or XML knockout view.
 *
 * XML documents are automatically identified if the document has a XML declaration, otherwise the document is identifed as HTML.
 *
 * @param document Raw document as string
 * @param bindingNames attribute names to interpret as bindings
 * @param forceToXML interpret document as XML
 */
export function parse(document: string, program: Program, bindingNames?: string[], forceToXML = false): Node[] {
	// const _ = program['_']

	const nodeParser = new documentParser.Parser<Node[]>()

	nodeParser.yy = new YY(bindingNames ?? [])

	nodeParser.lexer.options.ranges = true

	const ast = nodeParser.parse(document)

	if (!forceToXML)
		transformSelfClosingNodes(ast)

	return ast

	// TODO: add validation steps

	// TODO: Lint rule: Only one binding allowed to create child context!
	// TODO: The range includes the html tag. Make it correct.
	// program.problems.push(new Problem('multiple-context-bindings', range, parentBindings.map(b => b.bindingHandler).toString()))

	// TODO: lint rule for making bindinghandler specification mandatory on closing tags "ko/ <mandatory here>:"
	// TODO: add lint rule for checking that we do not interleave the html node hierarchy with the virtual elements.
	// (Virtual elements start and stop elements' should align with the html element hierarchy.)
	// Probably by checking that the 'context.parentContext' is the same as the 'parentContext'

	// TODO: add linting rule for verifying that "ko/ <xxx>", where xxx is specified and matches the element to pop from the stack

	// TODO: validate that comment bindings are singular

	// TODO: validate that empty nodes does not use "controls decendant bindings"-bindings

	// TODO: automatically identify document as XML if the document has a XML declaration
}
