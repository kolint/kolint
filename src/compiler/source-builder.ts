import { CodeWithSourceMap, SourceNode } from 'source-map'
import * as path from 'path'
import { Binding, Document as DOMDocument, IdentifierNode, BindingExpression, BindingName, TypeNode, BindingContext, ChildContextNode } from '../parser/syntax-tree'
import utils from '../utils'

/**
 * Transforms an identifiers string representation, but retains the correct source map locations
 * @param prefix string to append before the actual binding text. May not include control characters to change line or column.
 * @param binding
 * @param postfix string to append after the actual binding text. May not include control characters to change line or column.
 */
function wrapIdentifier(prefix: string, binding: BindingName, postfix: string) {
	const newLoc = Object.assign({}, binding.loc)
	newLoc.first_column += prefix.length
	newLoc.last_column -= postfix.length
	return new IdentifierNode<string>(`${prefix}${binding.name}${postfix}`, newLoc)
}

export class SourceBuilder {
	private revision = 0
	private currentNode: SourceNode
	private rootNode: SourceNode

	public constructor(public markupFileName: string, private document: DOMDocument) {
		// this.source = ts.createSourceFile(this.originalFileName + '.g.ts', this.CreateScaffold(), ts.ScriptTarget.ES2018)
		// Generate Source Map based on the Html View (Precompiled View -> Html View)
		this.rootNode = this.currentNode = new SourceNode(null, null, null, [
			new SourceNode(null, null, markupFileName, this.createScaffold(), 'scaffold'),
			...this.createImportStatements(markupFileName)
		])
	}

	/**
	 * Create a new revision of the content.
	 * @returns the new revision number
	 */
	public commit(name?: string): void {
		const revisionName = `revision ${++this.revision}`
		this.currentNode = new SourceNode()
		if (name)
			this.currentNode.name = name
		this.rootNode = new SourceNode(null, null, null, [this.rootNode, this.currentNode], revisionName)
	}

	public changes(): SourceNode {
		return this.currentNode
	}

	/**
	 * Load scaffold into a source file
	 */
	private createScaffold(): string {
		const linterLibPath = path.resolve(__dirname, '../../lib/resources/context')
		return [
			`import { RootBindingContext, ChildBindingContext, StandardBindingContextTransforms, BindingContextTransform } from "${linterLibPath.replace(/\\/g, '\\\\')}"`,
			'type BindingContextTransforms = StandardBindingContextTransforms & CustomBindingTransforms',
			'function getBindingContextFactory<K extends keyof BindingContextTransforms>(bindingHandlerName: K) {',
			'	void bindingHandlerName',
			'	const factory: BindingContextTransforms[K] = 0 as any',
			'	return factory',
			'}\n'
		].join('\n')
	}

	private mapIdentifier(id: IdentifierNode<string>, transform?: (identifierName: string) => string) {
		const trans = transform ? transform(id.value) : id.value
		return new SourceNode(id.location.first_line ?? null, id.location.first_column ?? null, this.markupFileName, trans)
	}

	private mapExpression(expr: BindingExpression) {
		return new SourceNode(expr.loc.first_line ?? null, expr.loc.first_column ?? null, this.markupFileName, expr.text)
	}

	private join(elements: SourceNode[], delimiter: string) {
		const arr = utils.flat(elements.map(e => [e, delimiter]))
		arr.pop()
		return new SourceNode(null, null, null, arr)
	}

	private createImportStatements(markupFileName: string): (string | SourceNode)[] {
		const document = this.document
		const viewmodelImports = utils.flat(document.imports.map(importNode => {
			const isNamespaceImport = importNode.importSymbols.length === 1 && importNode.importSymbols[0].name.value === '*'
			const createMappedImportSymbol = (symbol: typeof importNode.importSymbols[0]) => symbol.name === symbol.alias ?
				new SourceNode(null, null, null, [this.mapIdentifier(symbol.name)]) :
				new SourceNode(null, null, null, [this.mapIdentifier(symbol.name), ' as ', this.mapIdentifier(symbol.alias)])
			if (isNamespaceImport) {
				const symbol = importNode.importSymbols[0]
				const name = createMappedImportSymbol(symbol)
				return ['import ', name, ' from ', this.mapIdentifier(importNode.modulePath, (id) => `"${id}"`), '\n']
			} else {
				const names = importNode.importSymbols.map(symbol => createMappedImportSymbol(symbol))
				const imports = this.join(names, ', ')
				return ['import { ', imports, ' } from ', this.mapIdentifier(importNode.modulePath, (id) => `"${id}"`), '\n']
			}
		}))

		return viewmodelImports
	}

	public createBindinghandlerImports(bindingNames: string[]): void {
		// TODO: Verify that the bindingNames are imported somehow
		const transforms = bindingNames.map(handler => new SourceNode(null, null, this.markupFileName, [`"${handler}": BindingContextTransform<${handler}>\n`]))
		this.currentNode.add([
			'interface CustomBindingTransforms {\n',
			...transforms,
			'}\n'
		])
	}

	public createRootBindingContexts(context: BindingContext): void {
		const typeOf = context.isType ? '' : 'typeof '
		this.currentNode.add(`const ${context.id}: RootBindingContext<${typeOf}${context.typeAssertion ?? 'ViewModel'}> = (undefined as any)\n`)
	}

	public getContent(): CodeWithSourceMap {
		return this.rootNode.toStringWithSourceMap()
	}

	public createContextTransformation(bindingContextId: string, binding: Binding, contextMembers: string[], dataMembers: string[]): void {
		const loc = binding.expression.loc
		const transformation = new SourceNode(loc.first_line ?? null, loc.first_column ?? null, this.markupFileName,
			[
				`function transformation_${binding.identifierName}($context: typeof ${bindingContextId}) {\n`,
				`const { ${contextMembers.join(', ')} } = $context\n`,
				'function tmp() {\n',
				`const { ${dataMembers.join(', ')} } = $context.$data\n`,
				'return ', this.mapExpression(binding.expression), '\n',
				'}\n',
				'const bindingTransform = getBindingContextFactory(', this.mapIdentifier(wrapIdentifier('"', binding.bindingHandler, '"')), ')\n',
				'return bindingTransform(tmp(), $context)\n',
				'}\n'
			])
		this.currentNode.add(transformation)
	}

	public emitContextDefinition(ancestorContextId: string, binding: Binding): void {
		const definition = `const ${binding.identifierName} = transformation_${binding.identifierName}(${ancestorContextId})\n`
		this.currentNode.add(definition)
	}

	public emitContextDefinition2(typeNode: TypeNode): void {
		const x = typeNode.vm
		const type = x instanceof ChildContextNode ?
			this.mapIdentifier(x.type.ref) :
			'undefined'
		const definition = [`const ${typeNode.getContext().id}: ChildBindingContext<`, type, `, typeof ${typeNode.getParentContext().id}> = undefined\n`]
		this.currentNode.add(definition)
	}
}