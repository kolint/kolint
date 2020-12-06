import { Document, Binding, Node, BindingName, BindingExpression, Diagnostic } from '../parser'
import { SourceNode } from 'source-map'
import * as path from 'path'
import { BindingHandlerImportNode } from '../parser/bindingDOM'

//#region init

type Chunk = string | SourceNode | (string | SourceNode)[]

const _flat = (acc: (string | SourceNode)[], val: string | SourceNode | (string | SourceNode)[]) =>
	Array.isArray(val) ? acc.concat(...val) : acc.concat(val)
const flat: [typeof _flat, []] = [_flat, []]

/**
 * **1.** Adds newline for each chunk.
 *
 * **2.** If *template string*, trims newlines and spaces in the start and end of string.
 *
 * **3.** If *array with string and source nodes*, does not add new line for each chunk, just at the end.
 *
 * **4.** If *empty*, returns a new line.
 *
 * ```
 * 1. newline('line1', 'line2')
 * 2. newline`interface Example { ... }`
 * 3. newline(['same line', new SourceNode])
 * 4. newline; newline()
 * ```
 */
function newline(strings: TemplateStringsArray, ...values: string[]): string
function newline(chunks: (string | SourceNode)[]): (string | SourceNode)[]
function newline(strings: string[]): string
function newline(...strings: string[]): string
function newline(): '\n'
function newline(...chunks: unknown[]): unknown {
	if (chunks.length === 0)
		return '\n'
	else if (chunks.length === 1) {
		const chunk = chunks[0] as (string | SourceNode)[]

		const hasSourceNode = Boolean(chunk.find(chunk => chunk instanceof SourceNode))

		if (hasSourceNode) {
			return chunk.concat('\n')
		} else {
			return chunk.join('\n') + '\n'
		}
	} else if (chunks[0] && typeof chunks[0] === 'object' && 'raw' in chunks[0]) {
		const strings = chunks[0] as TemplateStringsArray
		const values = chunks.slice(1) as string[]

		return strings.map((string, index) => values[index] ? string + values[index] : string).join('').replace(/(?:^[\s\n]*|[\s\n]*?$)/g, '') + '\n'
	} else {
		return chunks.join('\n') + '\n'
	}
}

//#endregion init

//#region emit

export function emit(viewPath: string, document: Document): { file: string, sourceMap: string } {
	const emit = (node: Node | BindingName | BindingExpression, action: () => Chunk): SourceNode => {
		return new SourceNode(node.loc.first_line, node.loc.first_column, viewPath, action())
	}

	if (document.viewmodelReferences.length < 1) {
		throw new Diagnostic('no-viewmodel-reference', undefined, path.relative(process.cwd(), viewPath))
	}

	const root = new SourceNode(null, null, null)

	const contextDeclarationFilePath = path.join(__dirname, '../../lib/context').replace(/\\/g, '/')
	const { bindingContexts, bindings: bindingStubs } = generateBindingStubs(document.bindings, 'root_context', emit)

	const viewmodelImportModulePath = new SourceNode(
		// modulePath is a string and can therefore not be multiline
		document.viewmodelReferences[0].modulePath.location.first_line,
		document.viewmodelReferences[0].modulePath.location.first_column - 1,
		viewPath,
		`'${document.viewmodelReferences[0].modulePath.value}'`
	)

	root.add(([

		newline`/* eslint-disable */`,

		newline`import { RootBindingContext, StandardBindingContextTransforms, Overlay, BindingContextTransform } from '${contextDeclarationFilePath}'`,

		// TODO: multiple import statemnets
		// TODO: Unique ViewModel names
		newline(document.viewmodelReferences[0].isTypeof ? [
			'import _ViewModel from ', viewmodelImportModulePath, '\n',
			'type ViewModel = typeof _ViewModel\n'
		] :
			[
				'import ViewModel from ', viewmodelImportModulePath, '\n'
			]),

		newline(
			'function getBindingContextFactory<K extends keyof BindingContextTransforms>(bindingHandlerName: K) {',
			'	void bindingHandlerName',
			'	const factory: BindingContextTransforms[K] = 0 as any;',
			'	return factory;',
			'}',
		),

		// TODO: move to emit (root.add)
		emitBHImportStatements(document.bindingHandlerReferences, viewPath),

		// newline(
		// 	`interface ${names.Types.BindingHandlers} extends ${names.Types.BuiltInBindingHandlers} {`,
		// 	`	'koko': BindingHandler<${names.Types.BindingHandlerType}<custombindinghandler_1>>`,
		// 	`}`
		// ),

		newline,

		newline,

		newline`const root_context: RootBindingContext<ViewModel> = undefined as any`,

		newline,

		// TODO: move to emit (root.add)
		bindingContexts, bindingStubs,

		`//@ sourceMappingURL=${viewPath}`

	] as (string | SourceNode | (() => string))[]).map(item => typeof item === 'function' ? item() : item).reduce(...flat))

	// T extends ko.BindingHandler<(infer U)> ? U : never;
	//
	const unit = root.toStringWithSourceMap({ file: 'tmp.ts' })
	const generatedCode = unit.code
	const generatedMap = unit.map.toJSON()

	// TODO: maybe add option to save sourcemap to file
	//	let sourceMap = generatedMap.toString()

	return { file: generatedCode, sourceMap: JSON.stringify(generatedMap) }
}

//#endregion emit

//#region util

let contextCount = 0
function generateBindingStubs(bindings: Binding[], bindingContextId: string, emit: (node: Node | BindingName | BindingExpression, action: () => Chunk) => SourceNode): { bindingContexts: SourceNode, bindings: SourceNode } {
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
		const getChildBindingContextId = `getChildContext_${contextCount++}`
		const stub = new SourceNode()
		stub.add([
			`const ${getChildBindingContextId} = getBindingContextFactory(`, emit(childBinding.bindingHandler, () => `'${childBinding.bindingHandler.name}'`), ')\n',
			`const ${childBindingContextId} = ${getChildBindingContextId}(`, emit(childBinding.expression, () => [childBinding.identifierName, '(', bindingContextId, ')']), ', ', bindingContextId, ')\n'
		])

		bindingContextStubs.add(stub)
		const { bindingContexts, bindings } = generateBindingStubs(childBinding.childBindings, childBindingContextId, emit)
		bindingContextStubs.add(bindingContexts)
		bindingStubs.add(bindings)
	}
	return { bindingContexts: bindingContextStubs, bindings: bindingStubs }
}

function is<T>(value: T | undefined | null): value is T {
	return Boolean(value)
}

function emitBHImportStatements(refs: BindingHandlerImportNode[], sourcePath: string): (string | SourceNode)[] {
	const imports = refs.map(ref => {
		function getModulePathNode() {
			return new SourceNode(ref.modulePath.location.first_line, ref.modulePath.location.first_column - 1, sourcePath, ['\'', ref.modulePath.value, '\''])
		}

		if (!ref.imports) return

		const imports = ref.imports

		if (imports.length === 1 && ['*', 'default'].includes(imports[0].alias.value)) {
			// Single import

			const cimport = imports[0]

			const nodes = [
				`import ${cimport.alias.value === '*' ? '* as ' : ''}${cimport.isTypeof ? '_' : ''}bindinghandler_${cimport.index} from `, getModulePathNode(), ';\n'
			]

			if (cimport.isTypeof)
				nodes.push(`type bindinghandler_${cimport.index} = typeof _bindinghandler_${cimport.index};\n`)

			return nodes
		} else {
			// Mutliple imports

			const importExpressions = imports.map(cimport => `${cimport.name.value} as ${cimport.isTypeof ? '_' : ''}${cimport.alias.value}`)

			const nodes = [
				`import { ${importExpressions.join(', ')} } from `, getModulePathNode(), ';\n'
			]

			for (const cimport of imports)
				if (cimport.isTypeof)
					nodes.push(`type bindinghandler_${cimport.name.value} = typeof _bindinghandler_${cimport.index};\n`)

			return nodes

		}

	}).filter(is).flat(1)

	const bindinghandlers = refs.map(ref => {
		if (!ref.imports) return

		return ref.imports.map(imp => `'${imp.alias.value}': BindingContextTransform<bindinghandler_${imp.alias.value}>`)
	}).filter(is).flat(1)

	const bindinghandlersInterface = `interface BindingContextTransforms extends Overlay<{\n${bindinghandlers.join('\n')}\n}, StandardBindingContextTransforms> { }`

	return imports.concat(bindinghandlersInterface)
}

//#endregion util
