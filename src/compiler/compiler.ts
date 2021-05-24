/* eslint-disable @typescript-eslint/unbound-method */
import * as path from 'path'
import { SourceMapConsumer } from 'source-map'
import * as ts from 'typescript'
import { Diagnostic, Document, Reporting } from '../parser'
import { AstNode, BindingContext, BindingNode, TypeNode } from '../parser/syntax-tree'
import { isReserved } from '../utils'
import { SourceBuilder } from './SourceBuilder'

export class Compiler {
	private static getStandardOptions(): ts.CompilerOptions {
		const configPath = process.cwd()
		const configFileName = ts.findConfigFile(configPath, (p: string) => ts.sys.fileExists(path.resolve(configPath, p)))
		let compilerOptions: ts.CompilerOptions
		if (configFileName) {
			const configFile = ts.readConfigFile(configFileName, (path: string, encoding?: string | undefined) => ts.sys.readFile(path, encoding))
			const args = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './')
			compilerOptions = args.options
		} else {
			compilerOptions = {}
		}
		return compilerOptions
	}

	private getIdentifier(node: ts.Node, id: string): ts.Identifier | undefined {
		return node.forEachChild(child => {
			if (ts.isVariableDeclaration(child))
				if (ts.isIdentifier(child.name) && child.name.text === id)
					return child.name
			return this.getIdentifier(child, id)
		})
	}

	private static reservedNames = ['arguments']
	private static isReservedName(name: string) {
		return isReserved(name) || this.reservedNames.indexOf(name) !== -1 || name.startsWith('__')
	}

	private static getTypeProperties(type: ts.Type, checker: ts.TypeChecker): string[] {
		return checker.getPropertiesOfType(type)
			.filter(symbol => !symbol.valueDeclaration?.modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword || modifier.kind === ts.SyntaxKind.PrivateKeyword))
			.map(symbol => symbol.getName())
			.filter(name => !this.isReservedName(name)) // Reserved keywords cannot appear as varable names. Therefore we do not support binding contexts with those identifiers.
			// TODO: Possibly add support to be able to use all context names: Rewrite all context references in the bindings to the form '$data.<reference name>'
			// (This is done by validating that the <reference name> exists in the binding context.)
	}

	/**
	 * Get directly reachable binding nodes, plus any indirect (via type nodes) binding nodes
	 * @param parentNodes Starting nodes from where to start tracing dependencies
	 */
	private reachableBindingNodes(parentNodes: AstNode[], contextCreationCallback: (typeNode: TypeNode) => void): BindingNode[] {
		if (!parentNodes.length)
			return []
		const childNodes = parentNodes.map(node => node.childNodes).flat()
		// Split child nodes into buckets
		const bindingNodes = childNodes.filter((node: AstNode): node is BindingNode => node instanceof BindingNode)
		const typeNodes = childNodes.filter((node: AstNode): node is TypeNode => node instanceof TypeNode)

		// TODO: Move this mutating part outside of this otherwise pure function.
		for(const node of typeNodes) {
			node.childContext = node.getParentContext().createChildContext()
			contextCreationCallback(node)
		}

		return bindingNodes.concat(this.reachableBindingNodes(typeNodes, contextCreationCallback))
	}

	private getTypeOfIdentifier(idName: string, src: ts.Node, checker: ts.TypeChecker): ts.Type | undefined {
		const id = this.getIdentifier(src, idName)
		if (!id)
			throw new Error(`Unknown identifier '${idName}'.`)

		const symb = checker.getSymbolAtLocation(id)
		if (!symb)
			throw new Error(`Symbol '${idName}' was not defined.`)

		const type = checker.getTypeOfSymbolAtLocation(symb, id)
		if (type.flags & ts.TypeFlags.Any)
			return undefined
		return type
	}

	public async compile(documents: Document[], reporting: Reporting): Promise<void> {
		const srcFiles = new Map<string, ts.SourceFile>()
		const compilerOptions = Compiler.getStandardOptions()
		const compilerHost = ts.createCompilerHost(compilerOptions)
		compilerHost.getSourceFile = (fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): ts.SourceFile | undefined => {
			if (srcFiles.has(fileName))
				return srcFiles.get(fileName)

			const content = ts.sys.readFile(fileName)
			if (!content)
				throw new Error(`Bad file name '${fileName}'`)
			const src = ts.createSourceFile(fileName, content, languageVersion)
			srcFiles.set(fileName, src)
			return src
		}

		// Start with root TypeNode
		// NodeQueue = reachableBindingNodes(rootNode) // Direct child to a type Node or indirect via a type node (recursively)
		// Foreach node in queue assign to context (create context if necessary)
		// Output reachable bindings
		// Regenerate program and types
		// Identify new BindingContexts
		// 	- create context and bind to node
		// create new queue with reachableBindingNodes(oldQueue)
		// Repeat

		// * read scaffold
		// * inject imports for viewmodel and bindinghandlers
		const sources = documents.map(document => {
			const viewFilePath = document.viewFilePath
			const builder = new SourceBuilder(viewFilePath, document)

			if (!(document.rootNode instanceof TypeNode))
				throw new Error('Document must have a defined type at the root node')

			// * inject binding context (reference to viewmodel)
			// * store the name of the injected binding context identifier into the bindingQueue's binding object (for reference in the next iteration)

			// Create child contexts (if type is known), or collect all child binding candidates
			// (we need to investigate it's type before we know if it creates a new context or not).
			document.rootContext = BindingContext.createRoot(document.rootNode)
			document.rootNode.childContext = document.rootContext
			// document.rootContext = this.processImmediateChildNodes(document.rootNode, rootContext)
			const nodeQueue = this.reachableBindingNodes([document.rootNode], () => { /* empty */ })

			const importedBindings = document.imports.map(imp => imp.importSymbols.map(symb => symb.alias.value).filter(alias => document.bindingNames.find(name => name === alias))).flat()
			builder.createBindinghandlerImports(importedBindings)
			builder.createRootBindingContexts(document.rootContext)
			const code = builder.changes().toString()
			builder.commit()

			const filename = document.viewFilePath + '.g.ts'
			// Create initial SourceFile to use in the CompilerHost (to avoid having to write the content to disk first)
			srcFiles.set(filename, ts.createSourceFile(filename, code, ts.ScriptTarget.ES2018, true, ts.ScriptKind.TS))

			// * initialize bindingQueue to [root bindings] (binding queue represents all bindings on a specific level in the binding hierarchy, since we are processing bindings in breadth-first ordering)
			// const contextQueue = [document.rootContext]
			return { filename, builder, /*contextQueue,*/ nodeQueue }
		})

		const filenames = sources.map(source => source.filename)
		let program = ts.createProgram(filenames, compilerOptions, compilerHost)

		// Loop while there is a bindingQueue which is not empty:
		while (sources.some(source => source.nodeQueue.length)) {
			const checker = program.getTypeChecker()

			// Emit context transformations for all contexts (all known bindings for a context)
			for (const source of sources) {
				const { nodeQueue, filename, builder } = source
				const src = program.getSourceFile(filename)
				// * foreach binding object in bindingQueue
				// 	- inject context transformation with expanded objects for $context and $context.$data
				// 	(the binding context identifier is what was stored in the binding object in one of the previous steps)
				if (!src)
					throw new Error('missing parsed source')
				for (const node of nodeQueue) {

					// TODO: Do something like builder.getContext(node).id or something
					const identifierName = node.getParentContext().id

					const id = this.getIdentifier(src, identifierName)
					if (!id)
						throw new Error(`missing identifier '${identifierName}'`)

					const contextType = checker.getTypeAtLocation(id)

					// const binding = context.binding
					// if (binding) {
					// 	if (contextType.flags & ts.TypeFlags.Any) {
					// 		reporting.addDiagnostic(new Diagnostic('binding-context-any', binding.expression.loc))
					// 		continue
					// 	}
					// 	if (contextType.flags & ts.TypeFlags.Unknown) {
					// 		reporting.addDiagnostic(new Diagnostic('binding-context-unknown', binding.expression.loc))
					// 		continue
					// 	}
					// }

					// TODO: verify that the contextType inherits from the correct base class, otherwise show error.
					const contextMembers = Compiler.getTypeProperties(contextType, checker)

					const dataSymbol = contextType.getProperty('$data') // Transient Property flag set
					if (!dataSymbol) {
						throw new Error('missing $data member')
					}

					const dataType = checker.getTypeOfSymbolAtLocation(dataSymbol, id)
					// const dataType = checker.getTypeAtLocation(dataSymbol.valueDeclaration)
					const dataMembers = Compiler.getTypeProperties(dataType, checker)

					for(const binding of node.bindings)
						builder.createContextTransformation(identifierName, binding, contextMembers, dataMembers)

					// TODO: check the actual type produced for these. If they are idempotent (e.g. unchanged $parents-array), it should not be a child context.
					for(const binding of node.bindings)
						builder.emitContextDefinition(identifierName, binding)
				}
				const diff = builder.changes()
				const newText = src.getText() + diff.toString()
				srcFiles.set(filename, src.update(newText, ts.createTextChangeRange(ts.createTextSpan(0, src.end), newText.length)))
				builder.commit()
			}

			program = ts.createProgram(filenames, compilerOptions, compilerHost, program)

			// Inspect the transformations if they create new contexts. Update known bindings.
			for (const source of sources) {
				const checker = program.getTypeChecker()
				const { nodeQueue, filename, builder } = source
				const src = program.getSourceFile(filename)

				if (!src)
					throw new Error('missing parsed source')

				// Identify bindings that creates new BindingContexts
				// Create the binding contexts
				for(const node of nodeQueue) {
					const parentContextType = this.getTypeOfIdentifier(node.getParentContext().id, src, checker)
					const translations = node.bindings.
						map(binding =>	({ binding, type: this.getTypeOfIdentifier(binding.identifierName, src, checker) })).
						filter(translation => translation.type && translation.type !== parentContextType)
					// TODO: add to diagnostics instead of throwing an error
					// and separate into three buckets (context generating, ordinary, filtered out)
					if (translations.length > 1)
						throw new Error('Knockout does not support multiple context-generating bindings on the same DOM node.')

					// Create new binding contexts when new types are generated
					if (translations.length === 1) {
						const t = translations[0]
						node.childContext = node.getParentContext().createChildContext()
						node.childContext.id = t.binding.identifierName
					}
				}

				source.nodeQueue = this.reachableBindingNodes(nodeQueue, (typeNode: TypeNode) => {
					builder.emitContextDefinition2(typeNode)
				})
				const diff = builder.changes()
				const newText = src.getText() + diff.toString()
				srcFiles.set(filename, src.update(newText, ts.createTextChangeRange(ts.createTextSpan(0, src.end), newText.length)))
				builder.commit()
			}

			program = ts.createProgram(filenames, compilerOptions, compilerHost, program)
		}

		// Generate TS-diagnostics for all documents
		for (const [filename, sourceFile] of srcFiles) {
			const map = sources.find(source => source.filename === filename)?.builder.getContent().map
			const consumer = map ? await SourceMapConsumer.fromSourceMap(map) : undefined
			const diags = ts.getPreEmitDiagnostics(program, sourceFile)
			for (const diag of diags) {
				// TODO: send additional location information for the generated file etc.. the "reporting" (or whatever it's name should be) will have the information available for debug output etc.
				if (consumer)
					reporting.addDiagnostic(this.createMappedDiagnostic(diag, consumer))
				else
					reporting.addDiagnostic(this.createSimpleDiagnostic(diag))
			}
		}

		// Call sinks with file information for source maps, generated ts-files, etc. (send a file type hint in the call to reporting)
		for (const source of sources) {
			const { code, map } = source.builder.getContent()
			reporting.registerOutput(source.filename, code, map)
		}
	}

	public createSimpleDiagnostic(diag: ts.Diagnostic): Diagnostic {
		const filename = diag.file?.fileName ?? 'unknown'
		if (diag.file && diag.start) {
			const start = ts.getLineAndCharacterOfPosition(diag.file, diag.start)
			const end = ts.getLineAndCharacterOfPosition(diag.file, diag.start + (diag.length ?? 0) - 1)
			const range = diag.start ? [diag.start, diag.start + (diag.length ?? 0)] as const : [-1, -1] as const
			return new Diagnostic(filename, diag, { first_line: start.line + 1, first_column: start.character, last_line: end.line + 1, last_column: end.character, range: [range[0], range[1]] })
		}
		return new Diagnostic(filename, diag, { first_line: 0, first_column: 0, last_line: 0, last_column: 0, range: [-1, -1] })
	}

	public createMappedDiagnostic(diag: ts.Diagnostic, sm: SourceMapConsumer): Diagnostic {
		const filename = diag.file?.fileName ?? 'unknown'
		if (diag.file && diag.start) {
			const generatedStart = ts.getLineAndCharacterOfPosition(diag.file, diag.start)
			const generatedEnd = ts.getLineAndCharacterOfPosition(diag.file, diag.start + (diag.length ?? 0) - 1)
			const start = sm.originalPositionFor({ line: generatedStart.line + 1, column: generatedStart.character })
			const end = sm.originalPositionFor({ line: generatedEnd.line + 1, column: generatedEnd.character })
			const sourceName = start.source ?? filename
			if (start.line !== null && end.line !== null && start.column !== null && end.column !== null) {
				const range = diag.start ? [diag.start, diag.start + (diag.length ?? 0)] as const : [-1, -1] as const
				return new Diagnostic(sourceName, diag, { first_line: start.line, first_column: start.column + 1, last_line: end.line, last_column: end.column + 1, range: [range[0], range[1]] })
			}
			const range = diag.start ? [diag.start, diag.start + (diag.length ?? 0)] as const : [-1, -1] as const
			return new Diagnostic(filename, diag, { first_line: generatedStart.line + 1, first_column: generatedStart.character, last_line: generatedEnd.line + 1, last_column: generatedEnd.character, range: [range[0], range[1]] })
		}
		return new Diagnostic(filename, diag, { first_line: 0, first_column: 0, last_line: 0, last_column: 0, range: [-1, -1] })
	}
}
