/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/// <reference lib="dom" />

/** Merge properties, avoids property if the same name. `U`s type members will overwrite any conflicting type members in `T`. */
export type Overlay<T, U> = Omit<U, keyof T> & T

/** Returns the last element in a type array [ViewModel1, ViewModel2, ViewModel3] -> ViewModel3 */
type LastElement<Arr extends [...any]> = Arr extends [...infer U, infer T] ? T : never

/** Returns the first element in a type array [ViewModel1, ViewModel2, ViewModel3] -> ViewModel1 */
type FirstElement<Arr extends [...any]> = Arr[0]

export type ContextChain<BC extends BindingContext<any, any>> =
	BC extends ChildBindingContext<infer V, BindingContext<any>> ? [V, ...BC['$parents']] :
	BC extends RootBindingContext<infer V> ? [V] :
	[]

export type BindingContext<ViewModel extends any, ParentBinding extends BindingContext<any, any> | null = null> = RootBindingContext<ViewModel> | ChildBindingContext<ViewModel, ParentBinding> | BindingOverlay<ViewModel, ParentBinding>

export interface RootBindingContext<ViewModel> {
	$parents: []
	$root: ViewModel
	$data: ViewModel
	$rawData: MaybeObservable<ViewModel>
}

export interface ChildBindingContext<ViewModel, ParentContext extends BindingContext<any, {}>> {
	$parents: ContextChain<ParentContext>
	$parent: FirstElement<ContextChain<ParentContext>>
	$root: LastElement<[ViewModel, ...ContextChain<ParentContext>]>
	$data: ViewModel
	$rawData: MaybeObservable<ViewModel>
}

type BindingOverlay<Obj extends Record<string, any>, OriginalBindingContext extends BindingContext<any>> = Overlay<Obj, OriginalBindingContext>

export interface BindingHandler<T> {
	init?: (element: any, valueAccessor: () => T, allBindings?: any, viewModel?: any, bindingContext?: any) => any;
	update?: (element: any, valueAccessor: () => T, allBindings?: any, viewModel?: any, bindingContext?: any) => void;
}

export interface ControlFlowBindingHandler<T> extends BindingHandler<T> {
	transformContext(data?: unknown, parentContext?: BindingContext<any, {}>): object
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

export interface ReadonlyObservable<T> { (): T }
export interface Observable<T> extends ReadonlyObservable<T> { (value: T): void }
type ReadonlyObservableArray<T> = ReadonlyObservable<T[]>
type ObservableArray<T> = Observable<T[]>

export interface Computed<T> {
   (): T
   (value: T): this
}
export type PureComputed<T> = Computed<T>

export interface Subscribable<T> {
	subscribe: (...args: any[]) => any
}

export type MaybeObservable<T> = T | Observable<T>
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
	attr: BindingContextIdentityTransform<Record<string, MaybeReadonlyObservable<string>>> // TODO: Create types for the standard attributes
	text: BindingContextIdentityTransform<string>
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
	selectedOptions: BindingContextIdentityTransform<any>
	uniqueName: BindingContextIdentityTransform<boolean>
	template: BindingContextIdentityTransform<any>
	component: BindingContextIdentityTransform<string | { name: any, params: any }>
	if: BindingContextIdentityTransform<unknown>
	ifnot: BindingContextIdentityTransform<boolean>

	// TODO: Use this code instead when const string types are supported by typescript!
	// The generic type As should NEVER be used. It exists to keep the const string type. (https://github.com/microsoft/TypeScript/issues/30680)
	// foreach: <Value extends MaybeReadonlyObservableArray<Data> | MaybeReadonlyObservable<{ data: Data, as: As }>, Data, Context extends BindingContext, As extends string>(value: Value, parentContext: Context) =>
	// 	Value extends { data: MaybeObservableArray<infer T>, as: string } ?
	// 		Overlay<Record<Value['as'], T>, Context> :
	// 		Overlay<ChildBindingContext<Data, Context>, Context>

	// Since we do not have support for const string types in Typescript yet (see https://github.com/microsoft/TypeScript/issues/30680), we resort to simpler matching here and instead
	// we do more comprehensive analysis for 'foreach' bindings in-code instead.
	foreach: <Value extends MaybeReadonlyObservableArray<any> | MaybeReadonlyObservable<any>, Context extends BindingContext<any, {}>>(value: Value, parentContext: Context) =>
		Value extends Record<'as', infer T> & Record<'data', MaybeReadonlyObservableArray<(infer V)>> ?
			T extends string ? BindingOverlay<Record<T, V>, Overlay<ChildBindingContext<V, Context>, Context>> :
			'\'as\' must be a string literal' :
			//Value extends MaybeReadonlyObservable<Record<infer Key, MaybeReadonlyObservableArray<infer T>>> ? Overlay<Record<Key, T>, Overlay<ChildBindingContext<T, Context>, Context>> :
		Value extends MaybeReadonlyObservableArray<infer Data> ? Overlay<ChildBindingContext<Data, Context>, Context> :
		unknown
	
	using: StandardBindingContextTransforms['with']
	with: <V extends object, Context extends BindingContext<any, {}>>(value: MaybeReadonlyObservable<V>, parentContext: Context) => Overlay<ChildBindingContext<V, Context>, Context>
	let: <T extends object, Context extends BindingContext<any, {}>>(value: MaybeReadonlyObservable<T>, parentContext: Context) => Overlay<T, Context>
}
