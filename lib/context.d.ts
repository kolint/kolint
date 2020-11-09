/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/// <reference lib="dom" />

/** Merge properties, avoids property if the same name. `U`s type members will overwrite any conflicting type members in `T`. */
export type Overlay<T, U> = Omit<U, keyof T> & T

/** Returns the last element in a type array [ViewModel1, ViewModel2, ViewModel3] -> ViewModel3 */
type LastElement<Arr extends [...any]> = Arr extends [...infer U, infer T] ? T : never

/** Returns the first element in a type array [ViewModel1, ViewModel2, ViewModel3] -> ViewModel1 */
type FirstElement<Arr extends [...any]> = Arr[0]

/** Flatten an S-expression. Example [A, [B, [C, []]]] -> [A, B, C] */
type FlattenExpr<T> =
	T extends [infer U, infer V] ? [U, ...FlattenExpr<V>] :
	T extends [infer U] ? T :
	[]

/** Used to signal type argument error */
type BindingContextRequired = 'Argument must be a Binding Context'

/** Create an S-Expression from a BindinContext-hierarchy.
 * Example: ChildBindingContext<A, ChildBindingContext<B, RootBindingContext<C>>> -> [A, [B, [C, []]]] */
type CreateSExpr<BC> =
	BC extends ChildBindingContext<infer V, infer U> ? [V, CreateSExpr<U>] :
	BC extends RootBindingContext<infer V> ? [V] :
	BindingContextRequired;

type ViewModelArray<BC> = FlattenExpr<CreateSExpr<BC>>

export interface RootBindingContext<ViewModel> {
	$parents: []
	$root: ViewModel
	$data: ViewModel
	$rawData: MaybeObservable<ViewModel>
}

export interface ChildBindingContext<ViewModel, ParentContext> {
	$parents: ViewModelArray<ParentContext>
	$parent: FirstElement<ViewModelArray<ParentContext>>
	$root: LastElement<[ViewModel, ...ViewModelArray<ParentContext>]>
	$data: ViewModel
	$rawData: MaybeObservable<ViewModel>
}

export type BindingContext = RootBindingContext<unknown> | ChildBindingContext<unknown, unknown>

export interface ReadonlyObservable<T> { (): T }
export interface Observable<T> extends ReadonlyObservable<T> { (value: T): void }
type ReadonlyObservableArray<T> = ReadonlyObservable<T[]>
type ObservableArray<T> = Observable<T[]>

export interface Computed<T> {
   (): T
   (value: T): this
}
export interface PureComputed<T> extends Computed<T> { }

export interface Subscribable<T> {
	subscribe: (...args: any[]) => any
}

export type MaybeObservable<T> = T | Observable<T>
export type MaybeReadonlyObservable<T> = T | ReadonlyObservable<T>
export type MaybeObservableArray<T> = T[] | ObservableArray<T>
export type MaybeReadonlyObservableArray<T> = readonly T[] | ReadonlyObservableArray<T>
export type MaybeComputed<T> = T | Computed<T> | PureComputed<T>
export type MaybeSubscribable<T> = T | Subscribable<T>

/** Binding handler with value type `T`. */
export type BindingHandlerReturnType<T> = (value: MaybeObservable<T>, pc: BindingContext) => void

/** Standard for for normal binding handlers that does not control descendant bindings */
export type BindingContextIdentityTransform = <V, Context>(value: V, ctx: Context) => Context

// ----------------------------------------------------------------------------
//                 ADDITIONAL TYPES FOR BUILTIN BINDING HANDLERS               
// ----------------------------------------------------------------------------

// Additional Types for event, click, submit bindings.
type WindowEventListenerMap = {
	[key in keyof WindowEventMap]: (event: WindowEventMap[key]) => any
}

/**
 * **Binding Handlers**
 * 
 * An interface map of all binding handlers globally accessible. 
 * 
 * ----
 * 
 * **Available Types**
 * 
 * All available types that can be used for defining binding handlers.
 * 
 * ```typescript
 * // Binding handler with value type 'T'.
 * type BindingHandler<T>
 * 
 * // Binding handler changes context, with value type 'T', returns binding
 * // context `C`.
 * type ParentBindingHandler<T, C>
 * 
 * // Binding handler 'T'. Restricts to type binding handler.
 * type CustomBindingHandler<T>
 * 
 * // Binding context with data 'T', and if 'P' inherits from 'P'.
 * type BindingContext<T, P = unknown>
 * 
 * // Merge properties, avoids property if the same name. 'U's type members
 * // will overwrite any conflicting type members in 'T'.
 * type Overlay<T, U>
 * 
 * // Corresponding ko.Observable.
 * type Observable<T>
 * 
 * // Corresponding ko.ObservableArray.
 * type ObservableArray<T>
 * 
 * // Corresponding ko.MaybeObservable.
 * type MaybeObservable<T>
 * 
 * // Corresponding ko.MaybeObservableArray.
 * type MaybeObservableArray<T>
 * 
 * // Knockout library. Use builtin observables and computeds for better type checking.
 * namespace ko
 * ```
 * 
 * ----
 * 
 * **Examples**
 * 
 * Simple examples of what binding handlers may be defined.
 * 
 * ```typescript
 * interface Examples {
 * 	count: BindingHandler<number>
 * 	time: ParentBindingHandler<number, {
 * 		hours: number
 * 		minutes: number
 * 		seconds: number
 * 	}>
 * 	fastforeach: CustomBindingHandler<
 * 		<T, PC>
 * 		(value: MaybeObservableArray<T>, pc: PC) =>
 * 		BindingContext<ChildVM, PC>
 * 	>
 * }
 * ```
 */
export interface BindingReturnTypes {
	visible: BindingHandlerReturnType<boolean>
	hidden: BindingHandlerReturnType<boolean>
	html: BindingHandlerReturnType<boolean>
	class: BindingHandlerReturnType<string>
	css: BindingHandlerReturnType<string | object>
	style: BindingHandlerReturnType<object>
	attr: BindingHandlerReturnType<object>
	text: BindingHandlerReturnType<string>
	if: BindingHandlerReturnType<boolean>
	ifnot: BindingHandlerReturnType<boolean>
	event: BindingHandlerReturnType<WindowEventListenerMap>
	click: BindingHandlerReturnType<(event: WindowEventListenerMap['click']) => any>
	submit: BindingHandlerReturnType<(event: WindowEventListenerMap['submit']) => any>
	enable: BindingHandlerReturnType<boolean>
	disable: BindingHandlerReturnType<boolean>
	value: BindingHandlerReturnType<any>
	textInput: BindingHandlerReturnType<string>
	hasFocus: BindingHandlerReturnType<() => any>
	checked: BindingHandlerReturnType<boolean>
	checkedValue: BindingHandlerReturnType<any>
	options: BindingHandlerReturnType<string[]>
	selectedOptions: BindingHandlerReturnType<string[]>
	uniqueName: BindingHandlerReturnType<() => boolean>
//	template: BindingHandler<string | ko.BindingTemplateOptions>
	component: BindingHandlerReturnType<{
		name: any
		params: any
	}>
}

export interface StandardBindingContextTransforms {
	visible: BindingContextIdentityTransform
	hidden: BindingContextIdentityTransform
	html: BindingContextIdentityTransform
	class: BindingContextIdentityTransform
	css: BindingContextIdentityTransform
	style: BindingContextIdentityTransform
	attr: BindingContextIdentityTransform
	text: BindingContextIdentityTransform
	event: BindingContextIdentityTransform
	click: BindingContextIdentityTransform
	submit: BindingContextIdentityTransform
	enable: BindingContextIdentityTransform
	disable: BindingContextIdentityTransform
	value: BindingContextIdentityTransform
	textInput: BindingContextIdentityTransform
	hasFocus: BindingContextIdentityTransform
	checked: BindingContextIdentityTransform
	checkedValue: BindingContextIdentityTransform
	options: BindingContextIdentityTransform
	selectedOptions: BindingContextIdentityTransform
	uniqueName: BindingContextIdentityTransform
	template: BindingContextIdentityTransform
	component: BindingContextIdentityTransform
	if: BindingContextIdentityTransform
	ifnot: BindingContextIdentityTransform

	foreach: <V, Context extends BindingContext>(value: MaybeReadonlyObservableArray<V>, parentContext: Context) =>
		V extends { data: MaybeObservableArray<infer T>; as: string } ? unknown : // TODO: Try to figure out the value of 'as' when it is statically decided. Make sure to properly dissuade the user to use the 'as'-form when we have no chance of deducing the resulting type during compile-time.
		Overlay<ChildBindingContext<V, Context>, Context>
	using: StandardBindingContextTransforms['with']
	with: <V extends object, Context extends BindingContext>(value: MaybeReadonlyObservable<V>, parentContext: Context) => Overlay<ChildBindingContext<V, Context>, Context>
	let: <T extends object, Context extends BindingContext>(value: MaybeReadonlyObservable<T>, parentContext: Context) => Overlay<Context, T>
}