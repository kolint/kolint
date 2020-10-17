import { Document, Binding, ViewModelNode, Node, BindingName, BindingExpression, Diagnostic } from '../parser'
import { SourceNode } from 'source-map'
import * as path from 'path'

function emitImportStatement(ref: ViewModelNode, sourcePath: string): (string | SourceNode)[] {
	return ['import ViewModel from ', new SourceNode(ref.loc.first_line, ref.loc.first_column, sourcePath, ['\'', ref.modulePath, '\'']), ';\n']
}

type Chunk = string | SourceNode | (string | SourceNode)[]

export function emit(viewPath: string, document: Document): { file: string; sourceMap: string } {
	const emit = (node: Node | BindingName | BindingExpression, action: () => Chunk): SourceNode => {
		return new SourceNode(node.loc.first_line, node.loc.first_column, viewPath, action())
	}

	const viewmodelRef = document.viewmodelReferences[0]
	if (!viewmodelRef) {
		throw new Diagnostic('no-viewmodel-reference', undefined, path.relative(process.cwd(), viewPath))
	}

	// TODO: Allow multiple import statments

	const sn = new SourceNode(null, null, viewPath)
	sn.add([
		'/* eslint-disable */\n',
		'import {\n',
		'\tBindingContext,\n',
		'\tBindingHandler,\n',
		'\tBindingHandlers as BuiltInBindingHandlers,\n',
		'\tCustomBindingHandler,\n',
		'\tOverlay,\n',
		'\tParentBindingHandler,\n',
		'\tko\n',
		`} from \'${path.join(__dirname, '../../lib/context').replace(/\\/g, '/')}\';\n`
	])

	sn.add(emitImportStatement(viewmodelRef, viewPath))

	// `interface BindingHandlers extends BuiltInBindingHandlers {
	// 	'koko': BindingHandler<bhType<custombindinghandler_1>>
	// 	'koko': BindingHandler<ReturnType<Parameters<custombindinghandler_1['init']>[1]>>
	// }`

	// T extends ko.BindingHandler<(infer U)> ? U : never;
	// T extends { init: ko.BindingHandler['init'] } ? ReturnType<Parameters<T['init']>[1]> : T extends { update: ko.BindingHandler['update'] } ? ReturnType<Parameters<T['update']>[1]> : unknown

	sn.add('const handlers = void 0 as unknown as BuiltInBindingHandlers;\n')

	sn.add([
		'function getChildContext<K extends keyof BuiltInBindingHandlers, T extends Parameters<BuiltInBindingHandlers[K]>[0], P extends BindingContext<any>>(bh: K, value: T, parentContext: P) {\n',
		'\tconst cb = handlers[bh] as (value: T, pc: P) => BindingContext<any> | void;\n',
		'\tconst context = cb(value, parentContext);\n',
		'\tif (!context) return void 0 as unknown as BindingContext<unknown>;\n',
		'\treturn context;\n',
		'}\n'
	])

	sn.add('const root_context: BindingContext<ViewModel> = null as any;\n')

	const { bindingContexts, bindings: bindingStubs } = generateBindingStubs(document.bindings, 'root_context', emit)

	sn.add(bindingContexts)
	sn.add(bindingStubs)

	sn.add(`//@ sourceMappingURL=${viewPath}\n`)

	const unit = sn.toStringWithSourceMap({ file: 'tmp.ts' })
	const generatedCode = unit.code
	const generatedMap = unit.map.toJSON()

	// TODO: maybe add option to save sourcemap to file
	//	let sourceMap = generatedMap.toString()

	return { file: generatedCode, sourceMap: JSON.stringify(generatedMap) }
}

let contextCount = 0
function generateBindingStubs(bindings: Binding[], bindingContextId: string, emit: (node: Node | BindingName | BindingExpression, action: () => Chunk) => SourceNode): { bindingContexts: SourceNode; bindings: SourceNode } {
	const bindingContextStubs = new SourceNode()
	const bindingStubs = new SourceNode()

	for (const childBinding of bindings) {
		const sn = new SourceNode()
		sn.add([
			'function ', childBinding.identifierName, '($context: typeof ', bindingContextId, ') {\n',
			'    const context_placeholder = $context\n',
			'    {\n',
			'        const data_placeholder = $context.$data\n',
			'        return ', emit(childBinding.expression, () => childBinding.expression.text), '\n',
			'    }\n',
			'}\n'
		])
		bindingStubs.add(sn)

		// TODO: separate node preparations from sourcemap emit.
		const childBindingContextId = `context_${contextCount++}`
		const stub = new SourceNode()
		// const stub = `const ${childBindingContextId} = createChildContext['${childBinding.bindingHandler.name}'](${childBinding.identifierName}(${bindingContextId}), ${bindingContextId})`
		stub.add([
			'const ', childBindingContextId, ' = getChildContext(', emit(childBinding.bindingHandler, () => `'${childBinding.bindingHandler.name}'`), ',',
			emit(childBinding.expression, () => [childBinding.identifierName, '(', bindingContextId, ')']), ', ', bindingContextId, ')\n'
		])

		bindingContextStubs.add(stub)
		const { bindingContexts, bindings } = generateBindingStubs(childBinding.childBindings, childBindingContextId, emit)
		bindingContextStubs.add(bindingContexts)
		bindingStubs.add(bindings)
	}
	return { bindingContexts: bindingContextStubs, bindings: bindingStubs }
}
