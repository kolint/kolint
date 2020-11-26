import { Node, Document, BindingName, Binding, ViewModelNode, BindingExpression, NodeType, DiagNode, BindingHandlerImportNode } from './bindingDOM'
import { parseBindingExpression } from './compile-bindings'
import { Location } from './location'
import { Diagnostic, diagnostics } from '../diagnostic'
import { Reporting } from '../program'

// Build binding tree
export function createDocument(ast: Node[], reporting: Reporting): Document {
	// TODO: Remove root binding
	const root = new Binding(new BindingName('root', undefined as unknown as Location), new BindingExpression('', undefined as unknown as Location))
	const bindingStack: Binding[] = [root]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const viewmodelStack: ViewModelNode[] = [new ViewModelNode(undefined as any, undefined as any, undefined as any)]
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const bindinghandlersStack: BindingHandlerImportNode[] = [new BindingHandlerImportNode(undefined as any, undefined as any, undefined as any)]
	const nodeStack: Node[] = []
	const viewmodels: ViewModelNode[] = []
	const bindinghandlers: BindingHandlerImportNode[] = []

	for (const node of ast) {
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
					const bindings = parseBindingExpression(reporting, bindingData.bindingText, bindingData.location)
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
					const bindings = parseBindingExpression(reporting, bindingData.bindingText, bindingData.location)
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
	return new Document(root, viewmodels, bindinghandlers)
}
