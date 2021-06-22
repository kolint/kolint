/// <reference lib="dom" />
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type MaybeReactive<T> = ko.MaybeComputed<T> | ko.MaybeObservable<T>

export type BindingContext<ViewModel = any, ParentContext extends BindingContext = any, Parent = any, Root = any, Ancestors extends [...any, Root] = [...any, any]> = RootBindingContext<ViewModel> | ChildBindingContextImpl<ViewModel, ParentContext, Parent, Root, Ancestors>

export interface RootBindingContext<ViewModel> {
	$parents: []
	$root: ViewModel
	$data: ViewModel
	$rawData: MaybeReactive<ViewModel>
}

export interface ChildBindingContextImpl<ViewModel, ParentContext extends BindingContext, Parent, Root, Ancestors extends BindingContext[]> {
	$parentContext: ParentContext
	$parents: [Parent, ...Ancestors]
	$parent: Parent
	$root: Root
	$data: ViewModel
	$rawData: MaybeReactive<ViewModel>
}

export type ChildBindingContext<Child, Parent extends BindingContext> = ChildBindingContextImpl<Child, Parent, Parent['$data'], Parent['$root'], [Parent['$data'], ...Parent['$parents']]>

export interface BindingHandler<T> {
	init?: (element: any, valueAccessor: () => T, allBindings?: any, viewModel?: any, bindingContext?: any) => any;
	update?: (element: any, valueAccessor: () => T, allBindings?: any, viewModel?: any, bindingContext?: any) => void;
}

export interface ControlFlowBindingHandler<T> extends BindingHandler<T> {
	transformContext(data?: unknown, parentContext?: BindingContext): object
}

/** The parent binding context to child binding context transformation (the transformation function) */
export type BindingContextTransformation<T, ChildContext extends <Parent>(parent: Parent) => object> =
	<ParentContext>(value: MaybeReadonlyObservable<T>, parentContext: ParentContext) =>
		ChildContext extends <Parent>(parent: Parent) => infer R ? R : never

/**
 * Child binding context from control flow binding handler context transformation (transformContext).
 * Requires the new data type and parent binding context
 */
export type ChildBindingContextTransform<T extends (...args: any[]) => any, Data, ParentContext> =
	T extends (data?: Data, parentContext?: ParentContext) => infer R ? R : never

/** The parent binding context to child binding context transformation (the transformation function) */
export type ChildBindingContextTransformation<Handler extends ControlFlowBindingHandler<any>> =
	<Parent>(parent: Parent) => ChildBindingContextTransform<Handler['transformContext'], BindingHandlerType<Handler>, Parent>

/** The binding context transform of any bindinghandler */
export type BindingContextTransform<Handler extends BindingHandler<any>> =
	Handler extends ControlFlowBindingHandler<any> ?
		BindingContextTransformation<BindingHandlerType<Handler>, ChildBindingContextTransformation<Handler>> :
	BindingContextIdentityTransform<BindingHandlerType<Handler>>

/** The type of any binding handler */
export type BindingHandlerType<Handler extends BindingHandler<unknown>> = Handler extends BindingHandler<(infer U)> ? U : never;

export type ReadonlyObservable<T> = (ko.ObservableFunctions<T> | ko.ComputedFunctions<T>) & { (): T }
export type Observable<T> = ko.Observable<T>
type ReadonlyObservableArray<T> = ReadonlyObservable<T[]>



type ObservableArray<T> = ko.ObservableArray<T>

export interface Computed<T> {
   (): T
   (value: T): this
}
export type PureComputed<T> = Computed<T>

export interface Subscribable<T> {
	subscribe: (...args: any[]) => any
}

export type MaybeObservable<T> = ko.MaybeObservable<T>
export type MaybeReadonlyObservable<T> = T | ReadonlyObservable<T>
export type MaybeObservableArray<T> = T[] | ObservableArray<T>
export type MaybeReadonlyObservableArray<T> = readonly T[] | ReadonlyObservableArray<T>
export type MaybeComputed<T> = T | Computed<T> | PureComputed<T>
export type MaybeSubscribable<T> = T | Subscribable<T>

/** Base type for normal binding handlers that does not control descendant bindings */
type BindingContextIdentityTransform<V> = <Context>(value: MaybeReadonlyObservable<V>, ctx: Context) => Context

// ----------------------------------------------------------------------------
//                 ADDITIONAL TYPES FOR BUILTIN BINDING HANDLERS
// ----------------------------------------------------------------------------

// Additional Types for event, click, submit bindings.
type WindowEventCallbacks = {
	[key in keyof WindowEventMap]?: (data: any, event: WindowEventMap[key]) => any
}

export interface StandardBindingContextTransforms {
	visible: BindingContextIdentityTransform<boolean>
	hidden: BindingContextIdentityTransform<boolean>
	html: BindingContextIdentityTransform<string>
	class: BindingContextIdentityTransform<string>
	css: BindingContextIdentityTransform<string | Record<string, MaybeReadonlyObservable<boolean>>>
	style: BindingContextIdentityTransform<Record<string, MaybeReadonlyObservable<string>>>
	attr: BindingContextIdentityTransform<Record<string, MaybeReadonlyObservable<unknown>>> // TODO: Create types for the standard attributes
	text: BindingContextIdentityTransform<string | number> // Relaxed a bit to also accept numbers as valid "text" bindings.
	event: BindingContextIdentityTransform<WindowEventCallbacks>
	click: BindingContextIdentityTransform<(data: any, event: MouseEvent) => void>
	submit: BindingContextIdentityTransform<(form: HTMLFormElement) => void>
	enable: BindingContextIdentityTransform<boolean>
	disable: BindingContextIdentityTransform<boolean>
	value: BindingContextIdentityTransform<any>
	// Use this definition if the function can be guaranteed to return const string. Revisit
	// valueUpdate: BindingContextIdentityTransform<'input' | 'keyup' | 'keypress' | 'afterkeydown'>
	valueUpdate: BindingContextIdentityTransform<string>
	valueAllowUnset: BindingContextIdentityTransform<boolean>
	textInput: BindingContextIdentityTransform<string>
	hasFocus: BindingContextIdentityTransform<any>
	checked: BindingContextIdentityTransform<any>
	checkedValue: BindingContextIdentityTransform<any>
	options: BindingContextIdentityTransform<any>
	optionsText: BindingContextIdentityTransform<string>
	optionsCaption: BindingContextIdentityTransform<string>
	optionsValue: BindingContextIdentityTransform<string>
	selectedOptions: BindingContextIdentityTransform<any>
	uniqueName: BindingContextIdentityTransform<boolean>
	template: BindingContextIdentityTransform<any>
	component: BindingContextIdentityTransform<string | { name: any, params: any }>
	if: BindingContextIdentityTransform<unknown>
	ifnot: BindingContextIdentityTransform<unknown>

	// Since we do not have support for const string types in Typescript yet (see https://github.com/microsoft/TypeScript/issues/30680), we resort to a complex type 'Narrow' to make sure
	// it is not widened to a string. Inspiration from ts-toolbelt.
	foreach: <Key, VM, Context extends BindingContext>(value: { data: MaybeReadonlyObservableArray<VM>, as: Narrow<Key> } | MaybeReadonlyObservableArray<VM>, parentContext: Context) =>
		Key extends string ? string extends Key ?
			'\'as\' must be a string literal' :
			ChildBindingContext<VM, Context> & { $index: Observable<number> } & Record<Key, VM> :
			ChildBindingContext<VM, Context> & { $index: Observable<number> }

	using: StandardBindingContextTransforms['with']
	with: <V extends object, Context extends BindingContext>(value: MaybeObservable<V>, parentContext: Context) => ChildBindingContext<V, Context>
	let: <T extends object, Context extends BindingContext>(value: MaybeObservable<T>, parentContext: Context) => Context & T
}

type Cast<A, B> = A extends B ? A : B;

type Narrowable =
	| string
	| number
	| bigint
	| boolean;

type Narrow<A> = Cast<A,
	| []
	| (A extends Narrowable ? A : never)
	| ({ [K in keyof A]: Narrow<A[K]> })
>;