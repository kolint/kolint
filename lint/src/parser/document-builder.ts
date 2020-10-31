import { Node, Document, BindingName, Binding, ViewModelNode, BindingExpression, NodeType, DiagNode, BindingHandlerImportNode } from './bindingDOM'
import { parseBindingExpression } from './compile-bindings'
import { Location } from './location'
import { Diagnostic, diagnostics } from '../diagnostic'
import { Program, ProgramInternal } from '../program'

/**
 * The shared interface between the jison lexer/parser and the viewParser.
 */
export interface YY {
	createViewRefNode(loc: Location, viewReference: string, name?: string): ViewModelNode
	createBindingHandlerRefNode(loc: Location, viewReference: string, names: Record<string, string>): BindingHandlerImportNode
	createStartNode(loc: Location, key: string): Node
	createEndNode(loc: Location, key: string): Node
	createEmptyNode(loc: Location, key: string): Node
	createDiagNode(loc: Location, key: string[], enable: boolean): Node
	createBindingData(loc: Location, data: string): unknown
	bindingNames: string[] // All attribute names that is matched by knockout for bindings.
}

// Build binding tree
export function createDocument(ast: Node[], program: ProgramInternal): Document {
	const _ = program._internal

	// TODO: Remove root binding
	const root = new Binding(new BindingName('root', undefined as unknown as Location), new BindingExpression('', undefined as unknown as Location))
	const bindingStack: Binding[] = [root]
	const viewmodelStack: ViewModelNode[] = [new ViewModelNode({ first_column: 0, first_line: 0, last_column: 0, last_line: 0, range: [0, 0] }, '')]
	const bindinghandlersStack: ViewModelNode[] = [new ViewModelNode({ first_column: 0, first_line: 0, last_column: 0, last_line: 0, range: [0, 0] }, '')]
	const nodeStack: Node[] = []
	const viewmodels: ViewModelNode[] = []
	const bindinghandlers: BindingHandlerImportNode[] = []

	for (const node of ast) {
		if (node instanceof DiagNode) {
			if (_) {
				if (node.enable) {
					if (node.keys.length)
						_.disabledDiagnostics = _.disabledDiagnostics.filter(diag => !node.keys.includes(diag))
					else {
						_.disableAllDiagnostics = false
						_.disabledDiagnostics = []
					}
				} else {
					if (node.keys.length)
						_.disabledDiagnostics = _.disabledDiagnostics.concat(node.keys)
					else
						_.disableAllDiagnostics = true
				}
			}
			// TODO: Only disable diagnostics inside of current element block.
			continue
		}
		if (node instanceof ViewModelNode) {
			viewmodelStack.pop()
			// TODO: Make sure that view reference is parsed before using it.
			viewmodelStack.push(node)
			viewmodels.push(node)
			continue
		}
		if (node instanceof BindingHandlerImportNode) {
			bindinghandlersStack.pop()
			// TODO: Make sure that view reference is parsed before using it.
			bindinghandlersStack.push(node)
			bindinghandlers.push(node)
			continue
		}
		switch (node.type) {
			case NodeType.Start: {
				const parentBinding = bindingStack[bindingStack.length - 1]
				if (node.bindings?.length) {
					// TODO: parse all binding strings. not just index 0
					const bindingData = node.bindings[0]
					const bindings = parseBindingExpression(program, bindingData.bindingText, bindingData.location)
					for (const binding of bindings) 
						binding.viewModelReference = viewmodelStack[viewmodelStack.length - 1]
					parentBinding.childBindings.splice(-1, 0, ...bindings)
					// TODO: If there are multiple binding properties on one row, only consider the first, but emit a warning if it controls descendants
					bindingStack.push(bindings[0])
				}
				else {
					bindingStack.push(parentBinding)
				}

				viewmodelStack.push(viewmodelStack[viewmodelStack.length - 1])
				bindinghandlersStack.push(bindinghandlersStack[viewmodelStack.length - 1])
				nodeStack.push(node)

				break
			}
			case NodeType.End: {
				bindingStack.pop()
				viewmodelStack.pop()
				bindinghandlersStack.pop()
				const lastNode = nodeStack.pop()

				if (lastNode?.key !== node.key)
					throw new Diagnostic(diagnostics['unbalanced-start-end-tags'], lastNode?.loc)

				break
			}
			case NodeType.Empty:
				if (node.bindings?.length) {
					// TODO: parse all binding strings
					const bindingData = node.bindings[0]
					const bindings = parseBindingExpression(program, bindingData.bindingText, bindingData.location)
					const parentBinding = bindingStack[bindingStack.length - 1]
					for (const binding of bindings)
						binding.viewModelReference = parentBinding.viewModelReference
					parentBinding.childBindings.splice(-1, 0, ...bindings)
				}
				break
		}

		if (!bindingStack.length) {
			// nodeStack.pop() will always return a node because bindingStack isn't 0 and can not be below.
			throw new Diagnostic(diagnostics['unbalanced-start-end-tags'], nodeStack.pop()?.loc)
		}
	}
	return new Document(root.childBindings, viewmodels, bindinghandlers)
}
