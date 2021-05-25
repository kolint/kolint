import utils from '../utils'
import { Location } from './location'

///
/// AST Node classes
///

export enum NodeType { Start, End, Empty }

export class BindingData {
	public constructor(public location: Location, public bindingText: string) { }
}

///
/// Shared classes for DOM and AST
/// TODO: Clean up and separate
///

/**
 * XML and HTML documents are parsed to a series of nodes (non hierarchical).
 */
export class Node {
	public constructor(public loc: Location, public key: string, public nodeType: NodeType) { }
	public bindings: BindingData[] | undefined // TODO: move to a subclass that is only used when we have an actual Knockout-Node
}

export class TypeReferenceNode extends Node {
	public constructor(location: Location, public ref: IdentifierNode<string>, public isType: boolean) {
		super(location, '', NodeType.Empty)
	}
}

export class ChildContextNode extends Node {
	public constructor(location: Location, public type: TypeReferenceNode) {
		super(location, '', NodeType.Empty)
	}
}

export class NamedContextNode extends Node {
	public constructor(location: Location, public ident: IdentifierNode<string>) {
		super(location, '', NodeType.Empty)
	}
}

export class ContextAssignmentNode extends Node {
	public constructor(location: Location, public ident: IdentifierNode<string>, public x?: string) {
		super(location, '', NodeType.Empty)
	}
}

/** Lint Node identifying a viewmodel module to use during type checking */
export class ImportNode extends Node {
	public constructor(location: Location, public importSymbols: { name: IdentifierNode<string>, alias: IdentifierNode<string> }[], public modulePath: IdentifierNode<string>) {
		super(location, '', NodeType.Empty)
	}
}

export interface BindingHandlerImport {
	isTypeof: boolean
	name: IdentifierNode<string>
	alias: IdentifierNode<string>
	index: number
}

/** Enable/Disable flags for single or multiple diagnostics. (ko-view-lint and typescript error codes) */
export class DiagNode extends Node {
	public constructor(loc: Location, public keys: string[], public enable: boolean) {
		super(loc, '', NodeType.Empty)
	}
}

export class IdentifierNode<T> {
	public constructor(public value: T, public location: Location) { }
}

///
/// Document Model Classes
///

export class BindingName {
	public constructor(public name: string, public loc: Location) { }
}

export class BindingExpression {
	public constructor(public text: string, public loc: Location) { }
}

export class Document {
	public rootContext?: BindingContext;
	/**
	 * The hierarchical representation of all the bindings in the view.
	 * @param viewFilePath file path to the view to compile
	 * @param rootBinding Top-level node representing the view. All data-bindings in the view are located as descendants to the root node.
	 * @param imports All viewmodels associated to the view, usually only one.
	 * @param bindingHandlerReferences All the view's used bindinghandlers except for the ones that are already globally available.
	 */
	public constructor(public viewFilePath: string, public rootNode: TypeNode, public imports: ImportNode[], public bindingNames: string[]) {
		this.viewFilePath = utils.canonicalPath(viewFilePath)
	}
}

let contextId = 0
export class BindingContext {
	public id: string
	public viewModelReference: ImportNode | undefined
	public childBindings: Binding[] = [] // All validated child bindings
	public childContexts: BindingContext[] = []
	public childBindingQueue: BindingNode[] = [] // Unprocessed binding nodes

	private constructor(public parent?: BindingContext, public typeAssertion?: string, public isType: boolean = true) {
		contextId++
		this.id = typeAssertion ?
			`context_${contextId}_${typeAssertion}` :
			`context_${contextId}`
	}

	public static createRoot(type: TypeNode): BindingContext {
		return new BindingContext(undefined, type.vm?.type.ref.value, type.vm?.type.isType)
	}

	public copyContext(): BindingContext {
		const context = new BindingContext(this.parent, this.typeAssertion)
		context.viewModelReference = this.viewModelReference
		this.parent?.childContexts.push(context)
		return context
	}

	public createChildContext(): BindingContext {
		const childContext = new BindingContext(this)
		childContext.viewModelReference = this.viewModelReference
		this.childContexts.push(childContext)
		return childContext
	}
}

export abstract class AstNode {
	public childNodes: AstNode[] = []
	public childContext: BindingContext | undefined

	protected constructor(public parent?: AstNode) {}
	public getContext(): BindingContext {
		if (this.childContext)
			return this.childContext
		if (this.parent)
			return this.parent.getContext()
		throw new Error('No top-level context was defined')
	}

	public getParentContext(): BindingContext {
		const parent = this.parent
		if (!parent)
			throw new Error('Missing expected parent node.')
		return parent.getContext()
	}
}

export class TypeNode extends AstNode {
	public constructor(parent?: AstNode, public vm?: ChildContextNode) {
		super(parent)
	}
}

export class BindingNode extends AstNode {
	public constructor(parent: AstNode, public bindings: Binding[]) {
		super(parent)
	}
}

export class Binding {
	private static identifierIndex = 0
	public identifierName = 'binding_' + (Binding.identifierIndex++).toString()
	public diagFlags: DiagNode | undefined

	/**
	 *
	 * @param bindingHandler key
	 * @param valueRaw value
	 * @param parentBinding
	 */
	public constructor(public bindingHandler: BindingName, public expression: BindingExpression) {}
}
