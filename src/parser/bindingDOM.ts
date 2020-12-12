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
	public constructor(public location: Location | undefined, public key: string, public type: NodeType) { }
	public bindings: BindingData[] | undefined // TODO: move to a subclass that is only used when we have an actual Knockout-Node
}

/** Lint Node identifying a viewmodel module to use during type checking */
export class ViewModelNode extends Node {
	public constructor(location: Location | undefined, public modulePath: IdentifierNode<string>, public isTypeof: boolean, public name?: IdentifierNode<string>) {
		super(location, '', NodeType.Empty)
	}
}

export interface BindingHandlerImport {
	isTypeof: boolean
	name: IdentifierNode<string>
	alias: IdentifierNode<string>
	index: number
}

export class BindingHandlerImportNode extends Node {
	public constructor(loc: Location | undefined, public modulePath: IdentifierNode<string>, public imports?: BindingHandlerImport[]) {
		super(loc, '', NodeType.Empty)
	}
}

/** Enable/Disable flags for single or multiple diagnostics. (ko-view-lint and typescript error codes) */
export class DiagNode extends Node {
	public constructor(loc: Location, public keys: string[], public enable: boolean) {
		super(loc, '', NodeType.Empty)
	}
}

export class IdentifierNode<T> {
	public constructor(public value: T, public location?: Location) { }
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
	public constructor(public rootBinding: Binding, public viewmodelReferences: ViewModelNode[], public bindingHandlerReferences: BindingHandlerImportNode[]) { }
}

export class Binding {
	public childBindings: Binding[] = []

	private static identifierIndex = 0
	public identifierName = 'binding_' + (Binding.identifierIndex++).toString()
	public viewModelReference: ViewModelNode | undefined
	public diagFlags: DiagNode | undefined

	/**
	 *
	 * @param bindingHandler key
	 * @param valueRaw value
	 * @param parentBinding
	 */
	public constructor(public bindingHandler: BindingName, public expression: BindingExpression, public parentBinding?: Binding) { }
}
