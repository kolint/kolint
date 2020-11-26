import { isReserved } from '../utils'
import { Document, BindingHandlerImportNode, IdentifierNode } from '../parser/bindingDOM'
import { Binding } from '../parser'
import * as ts from 'typescript'

interface BindingRelation {
	parent: Binding
	child: Binding
}

/**
 * Transformer responsible for filling out the scaffold with code based on the Knockout View Document Object Model
 */
export class ViewBindingsEmitter {
	private readonly bindingRelations: BindingRelation[]

	public constructor(private document: Document, private factory: ts.NodeFactory, private typeLibPath: string, private sourceMapSource: ts.SourceMapSource) {
		this.bindingRelations = this.flattenedBindingRelations(document.rootBinding)
	}

	public transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
		const document = this.document
		const bindingRelations = this.bindingRelations
		const childVisitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
			if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === '$typelib_placeholder')
				return context.factory.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, context.factory.createStringLiteral(this.typeLibPath))
			if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression)) {
				switch (node.expression.text) {
					case '$viewmodel_placeholder':
						return this.createViewmodelImports(document, context.factory)
					case '$bindinghandlers_placeholder':
						return this.createBindingImports(document.bindingHandlerReferences, context.factory)
					case '$transforms_placeholder':
						return this.createBindingLiteralTypes(document.bindingHandlerReferences, context.factory)
					case '$generated_contexts':
						return this.createTransformedContexts(document, bindingRelations, context.factory)
					case '$generated_bindings':
						return this.createBindingTransformations(bindingRelations, context.factory, this.sourceMapSource)
				}
			}
			return ts.visitEachChild(node, childVisitor, context)
		}
		return (file) => {
			const source = ts.visitEachChild(file, childVisitor, context)
			return context.factory.updateSourceFile(file, source.statements)
		}
	}

	private flattenedBindingRelations(parentBinding: Binding): BindingRelation[] {
		const bindings = parentBinding.childBindings
		if (!bindings)
			return []
		return bindings.map(binding =>
			[{ parent: parentBinding, child: binding }, ...this.flattenedBindingRelations(binding)]
		).flat(1)
	}

	private createViewLiteral(literal: IdentifierNode<string>) {
		const _stringLiteral = this.factory.createStringLiteral(literal.value)
		const stringLiteral = ts.setSourceMapRange(_stringLiteral, {
			pos: literal.location.range[0],
			end: literal.location.range[1],
			source: this.sourceMapSource
		})
		return stringLiteral
	}

	private createViewIdentifier(literal: IdentifierNode<string>, override?: string) {
		const idName = override ?? literal.value
		if (isReserved(idName)) {
			// TODO: create a diagnostic instead of throwing
			throw new Error(`Identifier is using the reserved keyword '${idName}'.`)
		}
		const _identifier = this.factory.createIdentifier(idName)
		const identifier = ts.setSourceMapRange(_identifier, {
			pos: literal.location.range[0],
			end: literal.location.range[1],
			source: this.sourceMapSource
		})

		return identifier
	}

	private createViewmodelImports(document: Document, factory: ts.NodeFactory): ts.ImportDeclaration[] {
		return document.viewmodelReferences.map(ref => {
			// TODO: * star imports defaults to 'ViewModel'. Add support for all other import types
			return factory.createImportDeclaration(undefined, undefined,
				factory.createImportClause(false, factory.createIdentifier('ViewModel'), undefined),
				this.createViewLiteral(ref.modulePath)
			)
		})
	}

	private createBindingImports(bindingRefs: BindingHandlerImportNode[], factory: ts.NodeFactory): ts.Node[] {
		return bindingRefs.map(ref => {
			const entries = ref.imports ?? []
			// TODO: support the other types of imports "*, * as, {...}"
			//		if (entries.length === 1 && ['*', 'default'].includes(ref.imports[entries[0]].value)) {
			if (entries.length === 1) {
				const { alias } = entries[0]
				return factory.createImportDeclaration(undefined, undefined,
					factory.createImportClause(false, this.createViewIdentifier(alias, `bindinghandler_${alias.value}`), undefined),
					this.createViewLiteral(ref.modulePath)
				)
			} else {
				throw new Error('namespaced imports are not yet supported')
				// return entries.map(([_ /*name*/, alias]) => {
				// 	const modulePathLiteral = factory.createStringLiteral(ref.modulePath)
				// 	ts.setSourceMapRange(modulePathLiteral, {
				// 		pos: ref.loc.range[0],
				// 		end: ref.loc.range[1],
				// 		source: sourceMapSource
				// 	})
			}
		})
	}

	private createBindingLiteralTypes(bindingRefs: BindingHandlerImportNode[], factory: ts.NodeFactory): ts.Node {
		const transforms = bindingRefs.map<ts.PropertySignature>(ref => {
			const entries = ref.imports ?? []
			// TODO: handle multiple entries.
			// if (entries.length != 1)
			// 	return [];
			const { alias } = entries[0]
			return factory.createPropertySignature(undefined,
				this.createViewLiteral(alias), undefined,
				factory.createTypeReferenceNode(
					factory.createIdentifier('BindingContextTransform'),
					[factory.createTypeReferenceNode(
						this.createViewIdentifier(alias, `bindinghandler_${alias.value}`),
						undefined
					)]
				)
			)
		})
		return factory.createInterfaceDeclaration(undefined, undefined,
			factory.createIdentifier('CustomBindingTransforms'), undefined, undefined, transforms
		)
	}

	private createRootTransformedContext(document: Document, factory: ts.NodeFactory) {
		// TODO: Handle case when we have multiple viewmodels...
		// const viewModelName = document.viewmodelReferences[0].name
		// const viewModelIdentifier = viewModelName ?
		// 	this.createViewIdentifier(viewModelName) :
		// 	factory.createIdentifier('ViewModel')
		return factory.createVariableDeclarationList(
			[factory.createVariableDeclaration(
				factory.createIdentifier('context_binding_0'),
				undefined,
				factory.createTypeReferenceNode(
					factory.createIdentifier('RootBindingContext'),
					[factory.createTypeReferenceNode(
						'ViewModel',
						undefined
					)]
				),
				factory.createAsExpression(
					factory.createIdentifier('undefined'),
					factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
				)
			)],
			ts.NodeFlags.Const
		)
	}

	private createTransformedContexts(document: Document, bindingRelations: { parent: Binding, child: Binding }[], factory: ts.NodeFactory): ts.Node[] {
		const statements = bindingRelations.map(relation => {
			return factory.createVariableStatement(undefined,
				factory.createVariableDeclarationList(
					[factory.createVariableDeclaration(
						factory.createIdentifier(`context_${relation.child.identifierName}`),
						undefined,
						undefined,
						factory.createCallExpression(
							factory.createIdentifier(`transformation_${relation.child.identifierName}`),
							undefined,
							[factory.createIdentifier(`context_${relation.parent.identifierName}`)]
						)
					)],
					ts.NodeFlags.Const
				)
			)
		})
		return [this.createRootTransformedContext(document, factory), ...statements]
	}

	private createBindingTransformations(bindingRelations: { parent: Binding, child: Binding }[], factory: ts.NodeFactory, sourceMapSource: ts.SourceMapSource): ts.Node[] {
		return bindingRelations.map(relation => {
			const childId = relation.child.identifierName
			const _bindingHandlerIdentifier = factory.createStringLiteral(relation.child.bindingHandler.name)
			const bindingHandlerIdentifier = ts.setSourceMapRange(_bindingHandlerIdentifier, {
				pos: relation.child.bindingHandler.loc.range[0],
				end: relation.child.bindingHandler.loc.range[1],
				source: sourceMapSource
			})
			const _returnStatement = factory.createIdentifier(relation.child.expression.text)
			const returnStatement = ts.setSourceMapRange(_returnStatement, {
				pos: relation.child.expression.loc.range[0],
				end: relation.child.expression.loc.range[1],
				source: sourceMapSource
			})

			return factory.createFunctionDeclaration(undefined, undefined, undefined,
				factory.createIdentifier(`transformation_${childId}`), undefined,
				[factory.createParameterDeclaration(undefined, undefined, undefined,
					factory.createIdentifier('$context'), undefined,
					factory.createTypeQueryNode(factory.createIdentifier(`context_${relation.parent.identifierName}`)), undefined
				)],
				undefined,
				factory.createBlock(
					[
						factory.createVariableStatement(
							undefined,
							factory.createVariableDeclarationList(
								[factory.createVariableDeclaration(
									factory.createIdentifier('$context_placeholder'),
									undefined,
									undefined,
									factory.createIdentifier('$context')
								)],
								ts.NodeFlags.Const
							)
						),
						factory.createFunctionDeclaration(undefined, undefined, undefined,
							factory.createIdentifier('tmp'), undefined,
							[],
							undefined,
							factory.createBlock(
								[
									factory.createVariableStatement(
										undefined,
										factory.createVariableDeclarationList(
											[factory.createVariableDeclaration(
												factory.createIdentifier('$data_placeholder'),
												undefined,
												undefined,
												factory.createPropertyAccessExpression(
													factory.createIdentifier('$context'),
													factory.createIdentifier('$data')
												)
											)],
											ts.NodeFlags.Const
										)
									),
									factory.createReturnStatement(returnStatement)
								],
								true
							)
						),
						factory.createVariableStatement(
							undefined,
							factory.createVariableDeclarationList(
								[factory.createVariableDeclaration(
									factory.createIdentifier('bindingTransform'), undefined, undefined,
									factory.createCallExpression(
										factory.createIdentifier('getBindingContextFactory'), undefined,
										[bindingHandlerIdentifier]
									)
								)],
								ts.NodeFlags.Const
							)
						),
						factory.createReturnStatement(factory.createCallExpression(
							factory.createIdentifier('bindingTransform'),
							undefined,
							[
								factory.createCallExpression(
									factory.createIdentifier('tmp'),
									undefined,
									[]
								),
								factory.createIdentifier('$context')
							]
						))
					],
					true
				)
			)
		})
	}
}
