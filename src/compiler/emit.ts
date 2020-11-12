import { Document, Binding, ViewModelNode, Node, BindingName, BindingExpression, Diagnostic } from '../parser'
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
function newline(...chunks: any[]): any {
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
	} else if (typeof chunks[0] === 'object' && 'raw' in chunks[0]) {
		const strings = chunks[0] as TemplateStringsArray
		const values = chunks.slice(1) as string[]

		return strings.map((string, index) => values[index] ? string + values[index] : string).join('').replace(/(?:^[\s\n]*|[\s\n]*?$)/g, '') + '\n'
	} else {
		return chunks.join('\n') + '\n'
	}
}

//#endregion init

//#region emit

export function emit(viewPath: string, document: Document): { file: string; sourceMap: string } {
	const emit = (node: Node | BindingName | BindingExpression, action: () => Chunk): SourceNode => {
		return new SourceNode(node.loc.first_line, node.loc.first_column, viewPath, action())
	}

	if (document.viewmodelReferences.length < 1) {
		throw new Diagnostic('no-viewmodel-reference', undefined, path.relative(process.cwd(), viewPath))
	}

	const root = new SourceNode(null, null, null)

	const contextDeclarationFilePath = path.join(__dirname, '../../lib/context').replace(/\\/g, '/')
	const { bindingContexts, bindings: bindingStubs } = generateBindingStubs(document.bindings, 'root_context', emit)

	const names = {
		/**
		 * Types and interface names
		 */
		Types: {
			BuiltInBindingHandlers: 'BuiltInBindingHandlers',
			BindingHandlers: 'BindingHandlers',
			BindingHandlerType: 'BHType',
			BindingHandlerAdapter: 'BindingHandlerAdapter'
		}
	}

	/*
		If a name is used more than once in the emitted code, the name should be added to names.
		All static interfaces and types should be implemented in lib/context.d.ts.
	*/
	root.add(([

		newline
			`/* eslint-disable */`,

		newline
			`import { RootBindingContext, StandardBindingContextTransforms, Overlay, BindingContextTransform } from '${contextDeclarationFilePath}'`,

		newline([
			// TODO: multiple import statemnets
			// TODO: Unique ViewModel names
			'import ViewModel from ',
			new SourceNode(
				document.viewmodelReferences[0].loc.first_line,
				document.viewmodelReferences[0].loc.first_column,
				viewPath,
				`'${document.viewmodelReferences[0].modulePath}'`
			)
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

		newline
			`const root_context: RootBindingContext<ViewModel> = undefined as any`,

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
		const getChildBindingContextId = `getChildContext_${contextCount++}`
		const stub = new SourceNode()
		stub.add([
			`const ${getChildBindingContextId} = getBindingContextFactory(`, emit(childBinding.bindingHandler, () => `'${childBinding.bindingHandler.name}'`), `)\n`,
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
	const imports = refs.map((ref, index) => {
		if (!ref.imports) return

		const entries = Object.entries(ref.imports)

		if (entries.length === 1 && ['*', 'default'].includes(entries[0][0]))

			switch (entries[0][0]) {
				case '*':
					return [`import * as bindinghandler_${entries[0][1]} from `, new SourceNode(ref.loc.first_line, ref.loc.first_column, sourcePath, ['\'', ref.modulePath, '\'']), ';\n']

				case 'default':
					return [`import bindinghandler_${entries[0][1]} from `, new SourceNode(ref.loc.first_line, ref.loc.first_column, sourcePath, ['\'', ref.modulePath, '\'']), ';\n']
			}

		else

			return [`import { ${entries.map(([name, alias]) => `${name} as bindinghandler_${alias}`).join(', ')} } from `, new SourceNode(ref.loc.first_line, ref.loc.first_column, sourcePath, ['\'', ref.modulePath, '\'']), ';\n']

	}).filter(is).flat(1)

	const bindinghandlers = refs.map((ref, index) => {
		if (!ref.imports) return

		const entries = Object.entries(ref.imports)

		return entries.map(([_name, alias]) => `'${alias}': BindingContextTransform<bindinghandler_${alias}>`)

	}).filter(is).flat(1)

	const bindinghandlersInterface = `interface BindingContextTransforms extends Overlay<{\n${bindinghandlers.join('\n')}\n}, StandardBindingContextTransforms> { }`

	return imports.concat(bindinghandlersInterface)
}

//#endregion util
