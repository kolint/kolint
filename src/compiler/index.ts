/* eslint-disable @typescript-eslint/unbound-method */
import { SourceMapConsumer } from 'source-map'
import * as ts from 'typescript'
import { Diagnostic } from '../diagnostic'
import { AstNode, BindingContext, BindingNode, Document, TypeNode } from '../parser/syntax-tree'
import { Reporting } from '../program'
import utils from '../utils'
import { CompilerHost } from './compiler-host'
import { SourceBuilder } from './source-builder'

function getIdentifier(node: ts.Node, id: string): ts.Identifier | undefined {
	return node.forEachChild(child => {
		if (ts.isVariableDeclaration(child))
			if (ts.isIdentifier(child.name) && child.name.text === id)
				return child.name
		return getIdentifier(child, id)
	})
}

function isReservedName(name: string): boolean {
	const reservedNames = ['arguments']
	return utils.isReserved(name) || reservedNames.indexOf(name) !== -1 || name.startsWith('__')
}

function getTypeProperties(type: ts.Type, checker: ts.TypeChecker): string[] {
	return checker.getPropertiesOfType(type)
		.filter(symbol => !symbol.valueDeclaration?.modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword || modifier.kind === ts.SyntaxKind.PrivateKeyword))
		.map(symbol => symbol.getName())
		.filter(name => !isReservedName(name)) // Reserved keywords cannot appear as varable names. Therefore we do not support binding contexts with those identifiers.
	// TODO: Possibly add support to be able to use all context names: Rewrite all context references in the bindings to the form '$data.<reference name>'
	// (This is done by validating that the <reference name> exists in the binding context.)
}

/**
 * Get directly reachable binding nodes, plus any indirect (via type nodes) binding nodes
 * @param parentNodes Starting nodes from where to start tracing dependencies
 */
function reachableBindingNodes(parentNodes: AstNode[], contextCreationCallback: (typeNode: TypeNode) => void): BindingNode[] {
	if (!parentNodes.length)
		return []
	const childNodes = utils.flat(parentNodes.map(node => node.childNodes))
	// Split child nodes into buckets
	const bindingNodes = childNodes.filter((node: AstNode): node is BindingNode => node instanceof BindingNode)
	const typeNodes = childNodes.filter((node: AstNode): node is TypeNode => node instanceof TypeNode)

	// TODO: Move this mutating part outside of this otherwise pure function.
	for (const node of typeNodes) {
		node.childContext = node.getParentContext().createChildContext()
		contextCreationCallback(node)
	}

	return bindingNodes.concat(reachableBindingNodes(typeNodes, contextCreationCallback))
}

function getTypeOfIdentifier(idName: string, src: ts.Node, checker: ts.TypeChecker): ts.Type | undefined {
	const id = getIdentifier(src, idName)
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

function createSimpleDiagnostic(diag: ts.Diagnostic): Diagnostic {
	const filename = diag.file?.fileName ?? 'unknown'
	if (diag.file && diag.start) {
		const start = ts.getLineAndCharacterOfPosition(diag.file, diag.start)
		const end = ts.getLineAndCharacterOfPosition(diag.file, diag.start + (diag.length ?? 0) - 1)
		const range = diag.start ? [diag.start, diag.start + (diag.length ?? 0)] as const : [-1, -1] as const
		return new Diagnostic(filename, diag, { first_line: start.line + 1, first_column: start.character, last_line: end.line + 1, last_column: end.character, range: [range[0], range[1]] })
	}
	return new Diagnostic(filename, diag, { first_line: 0, first_column: 0, last_line: 0, last_column: 0, range: [-1, -1] })
}

function createMappedDiagnostic(diag: ts.Diagnostic, consumer: SourceMapConsumer): Diagnostic {
	const filename = diag.file?.fileName ?? 'unknown'
	if (diag.file && diag.start) {
		const generatedStart = ts.getLineAndCharacterOfPosition(diag.file, diag.start)
		const generatedEnd = ts.getLineAndCharacterOfPosition(diag.file, diag.start + (diag.length ?? 0) - 1)
		const start = consumer.originalPositionFor({ line: generatedStart.line + 1, column: generatedStart.character })
		const end = consumer.originalPositionFor({ line: generatedEnd.line + 1, column: generatedEnd.character })
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

export interface Compiler {
	compile(documents: Document[], reporting: Reporting): Promise<void>
	compilerHost: CompilerHost
}

export function createCompiler(compilerHost: CompilerHost): Compiler {
	return {
		compilerHost,

		async compile(documents: Document[], reporting: Reporting): Promise<void> {
			const sourceFiles = new Map<string, ts.SourceFile>()

			const compilerOptions = compilerHost.getCompilerOptions()
			const tsCompilerHost = compilerHost.createTypescriptCompilerHost(compilerOptions)

			tsCompilerHost.getSourceFile = (fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): ts.SourceFile | undefined => {
				if (compilerHost.getSourceFile) {
					return compilerHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
				} else {
					if (sourceFiles.has(fileName)) {
						return sourceFiles.get(fileName)
					}

					const content = ts.sys.readFile(fileName)
					if (!content) {
						throw new Error(`Could not read file '${fileName}'.`)
					}

					const sourceFile = ts.createSourceFile(fileName, content, languageVersion)

					// Add source file to source files
					sourceFiles.set(fileName, sourceFile)

					return sourceFile
				}

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
			for (const doc of documents.filter(doc => !(doc.rootNode instanceof TypeNode)))
				reporting.addDiagnostic(new Diagnostic(doc.viewFilePath, 'no-viewmodel-reference', undefined, 'Document must have a defined type at the root node'))

			const sources = documents.filter(doc => doc.rootNode instanceof TypeNode).map(document => {
				const viewFilePath = document.viewFilePath
				const builder = new SourceBuilder(viewFilePath, document)

				// * inject binding context (reference to viewmodel)
				// * store the name of the injected binding context identifier into the bindingQueue's binding object (for reference in the next iteration)

				// Create child contexts (if type is known), or collect all child binding candidates
				// (we need to investigate it's type before we know if it creates a new context or not).
				document.rootContext = BindingContext.createRoot(document.rootNode)
				document.rootNode.childContext = document.rootContext
				// document.rootContext = this.processImmediateChildNodes(document.rootNode, rootContext)
				const nodeQueue = reachableBindingNodes([document.rootNode], () => { /* empty */ })

				const importedBindings = utils.flat(document.imports.map(imp => imp.importSymbols.map(symb => symb.alias.value).filter(alias => document.bindingNames.find(name => name === alias))))
				builder.createBindinghandlerImports(importedBindings)
				builder.createRootBindingContexts(document.rootContext)
				const code = builder.changes().toString()
				builder.commit()

				// The source file filename is required by the TypeScript compiler to end with .ts,
				// or and other valid TypeScript(/JavaScript) extension
				const filename = document.viewFilePath + '.ts'
				// Create initial SourceFile to use in the CompilerHost (to avoid having to write the content to disk first)
				sourceFiles.set(filename, ts.createSourceFile(filename, code, ts.ScriptTarget.ES2018, true, ts.ScriptKind.TS))

				// * initialize bindingQueue to [root bindings] (binding queue represents all bindings on a specific level in the binding hierarchy, since we are processing bindings in breadth-first ordering)
				// const contextQueue = [document.rootContext]
				return { filename, builder, /*contextQueue,*/ nodeQueue }
			})

			const filenames = sources.map(source => source.filename)
			let program = ts.createProgram(filenames, compilerOptions, tsCompilerHost)

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

						const id = getIdentifier(src, identifierName)
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
						const contextMembers = getTypeProperties(contextType, checker)

						const dataSymbol = contextType.getProperty('$data') // Transient Property flag set
						if (!dataSymbol) {
							throw new Error('missing $data member')
						}

						const dataType = checker.getTypeOfSymbolAtLocation(dataSymbol, id)
						// const dataType = checker.getTypeAtLocation(dataSymbol.valueDeclaration)
						const dataMembers = getTypeProperties(dataType, checker)

						for (const binding of node.bindings)
							builder.createContextTransformation(identifierName, binding, contextMembers, dataMembers)

						// TODO: check the actual type produced for these. If they are idempotent (e.g. unchanged $parents-array), it should not be a child context.
						for (const binding of node.bindings)
							builder.emitContextDefinition(identifierName, binding)
					}
					const diff = builder.changes()
					const newText = src.getText() + diff.toString()
					sourceFiles.set(filename, src.update(newText, ts.createTextChangeRange(ts.createTextSpan(0, src.end), newText.length)))
					builder.commit()
				}

				program = ts.createProgram(filenames, compilerOptions, tsCompilerHost, program)

				// Inspect the transformations if they create new contexts. Update known bindings.
				for (const source of sources) {
					const checker = program.getTypeChecker()
					const { nodeQueue, filename, builder } = source
					const src = program.getSourceFile(filename)

					if (!src)
						throw new Error('missing parsed source')

					// Identify bindings that creates new BindingContexts
					// Create the binding contexts
					for (const node of nodeQueue) {
						const parentContextType = getTypeOfIdentifier(node.getParentContext().id, src, checker)
						const translations = node.bindings.
							map(binding => ({ binding, type: getTypeOfIdentifier(binding.identifierName, src, checker) })).
							filter(translation => translation.type && translation.type !== parentContextType)
						const unknownBindings = translations.filter(t => t.type?.flags === ts.TypeFlags.Unknown)
						for(const b of unknownBindings)
							reporting.addDiagnostic(new Diagnostic(source.builder.markupFileName, 'binding-unknown', b.binding.bindingHandler.loc, b.binding.bindingHandler.name))

						if (translations.filter(t => t.type?.flags !== ts.TypeFlags.Unknown).length > 1)
							throw new Diagnostic(source.builder.markupFileName, 'multiple-context-bindings', translations[0].binding.expression.loc, translations.map(t => t.binding.bindingHandler.name).join(', '))

						// Create new binding contexts when new types are generated
						if (translations.length === 1) {
							const t = translations[0]
							node.childContext = node.getParentContext().createChildContext()
							node.childContext.id = t.binding.identifierName
						}
					}

					source.nodeQueue = reachableBindingNodes(nodeQueue, (typeNode: TypeNode) => {
						builder.emitContextDefinition2(typeNode)
					})

					const diff = builder.changes()
					const newText = src.getText() + diff.toString()
					sourceFiles.set(filename, src.update(newText, ts.createTextChangeRange(ts.createTextSpan(0, src.end), newText.length)))
					builder.commit()
				}

				program = ts.createProgram(filenames, compilerOptions, tsCompilerHost, program)
			}

			// Generate TS-diagnostics for all documents
			for (const [filename, sourceFile] of sourceFiles) {
				const map = sources.find(source => source.filename === filename)?.builder.getContent().map
				const consumer = map ? await SourceMapConsumer.fromSourceMap(map) : undefined
				const diags = ts.getPreEmitDiagnostics(program, sourceFile)
				for (const diag of diags) {
					// TODO: send additional location information for the generated file etc.. the "reporting" (or whatever it's name should be) will have the information available for debug output etc.
					if (consumer)
						reporting.addDiagnostic(createMappedDiagnostic(diag, consumer))
					else
						reporting.addDiagnostic(createSimpleDiagnostic(diag))
				}
			}

			// Call sinks with file information for source maps, generated ts-files, etc. (send a file type hint in the call to reporting)
			for (const source of sources) {
				const { code, map } = source.builder.getContent()
				// The source file always contains .ts in the end of the filename.
				reporting.registerOutput(source.filename.slice(0, -3), code, map)
			}
		}
	}
}
