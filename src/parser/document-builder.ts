import { Node, Document, ImportNode, NodeType, DiagNode, ChildContextNode, TypeNode, BindingNode } from './syntax-tree'
import { parseBindingExpression } from './compile-bindings'
import { Diagnostic, diagnostics } from '../diagnostic'
import { Reporting } from '../program'
import utils from '../utils'

// Build binding tree
export function createDocument(filePath: string, tokens: Node[], reporting: Reporting): Document {
	const domNodeStack: Node[] = [] // Keeps track of unbalanced documents
	const imports: ImportNode[] = [] // Imported symbols
	const astContextStack: TypeNode[] = [] // The current context for all bindings in the tree
	const allBindings = new Set<string>()

	function overrideViewmodel(vmType: ChildContextNode): void {
		const _ = astContextStack.pop()
		const parent = astContextStack.pop()
		if (parent) {
			astContextStack.push(parent)
			const newNode = new TypeNode(parent, vmType)
			parent.childNodes.push(newNode)
			astContextStack.push(newNode)
		} else {
			astContextStack.push(new TypeNode(parent, vmType))
		}
	}

	for (const node of tokens) {
		if (node instanceof DiagNode) {
			if (node.enable) {
				if (node.keys.length)
					reporting.enableDiagnostics(node.keys)
				else {
					reporting.enableAllDiagnostics()
				}
			} else {
				if (node.keys.length)
					reporting.disableDiagnostics(node.keys)
				else
					reporting.disableAllDiagnostics()
			}
			// TODO: Only disable diagnostics inside of current element block.
			continue
		}
		if (node instanceof ImportNode) {
			imports.push(node)
			continue
		}
		if (node instanceof ChildContextNode) {
			overrideViewmodel(node)
			continue
		}
		switch (node.nodeType) {
			case NodeType.Start: {
				let currentContext = astContextStack[astContextStack.length - 1]
				if (!currentContext)
					throw new Diagnostic(filePath, 'no-viewmodel-reference', Object.assign({}, node.loc))
				if (node.bindings?.length) {
					// There could be multiple data-binds on one element. Parse them all.
					// TODO: If there are multiple binding properties on one row, emit a warning if it controls descendants (unclear semantics of multiple bindings?)
					const bindings = utils.flat(node.bindings.map(bindingData => parseBindingExpression(filePath, reporting, bindingData.bindingText, bindingData.location)))
					if (bindings.length) {
						for(const b of bindings)
							allBindings.add(b.bindingHandler.name)
						const bindingNode = new BindingNode(currentContext, bindings)
						currentContext.childNodes.push(bindingNode)
						currentContext = bindingNode
					}
				}
				astContextStack.push(currentContext)
				domNodeStack.push(node)
				break
			}
			case NodeType.End: {
				astContextStack.pop()
				const lastNode = domNodeStack.pop()
				if (lastNode?.key !== node.key)
					throw new Diagnostic(filePath, diagnostics['unbalanced-start-end-tags'], lastNode?.loc)
				break
			}
			case NodeType.Empty: {
				if (node.bindings?.length) {
					// TODO: parse all binding strings
					const bindings = utils.flat(node.bindings.map(bindingData => parseBindingExpression(filePath, reporting, bindingData.bindingText, bindingData.location)))
					if (bindings.length) {
						for(const b of bindings)
							allBindings.add(b.bindingHandler.name)
						const currentContext = astContextStack[astContextStack.length - 1]
						if (!currentContext)
							throw new Diagnostic(filePath, 'no-viewmodel-reference', Object.assign({}, node.loc))
						const bindingNode = new BindingNode(currentContext, bindings)
						currentContext.childNodes.push(bindingNode)
					}
				}
				break
			}
		}
	}

	if (domNodeStack.length)
		reporting.addDiagnostic(new Diagnostic(filePath, diagnostics['unbalanced-start-end-tags'], domNodeStack.pop()?.loc))

	return new Document(filePath, astContextStack[0], imports, [...allBindings])
}
