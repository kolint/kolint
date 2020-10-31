/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

/// <reference lib="dom" />

import * as ko from 'ko://knockout'

/** Merge properties, avoids property if the same name. `U`s type members will overwrite any conflicting type members in `T`. */
export type Overlay<T, U> = Omit<U, keyof T> & T

/** Binding context with data `T`, and if `P` inherits from `P`. */
export type BindingContext<T, P = unknown> = Overlay<{
	$parents: BindingContext<any>[]
	$parent: unknown
	$root: unknown
	$data: T
	$rawData: T | Observable<T>
}, P>

export interface Observable<T> {
	(): T
	(value: T): void
}

export interface ObservableArray<T> {
	(): T[]
	(value: T[]): void
}

export interface Computed<T> {
   (): T
   (value: T): this
}

export interface PureComputed<T> extends Computed<T> { }

export interface Subscribable<T> {
	subscribe: (...args: any[]) => any
}

export type MaybeObservable<T> = T | Observable<T>
export type MaybeObservableArray<T> = T[] | ObservableArray<T>
export type MaybeComputed<T> = T | Computed<T> | PureComputed<T>
export type MaybeSubscribable<T> = T | Subscribable<T>

/** Binding handler with value type `T`. */
export type BindingHandler<T> = (value: MaybeObservable<T>, pc: BindingContext<any>) => void
/** Binding handler changes context, with value type `T`, returns binding context `C`. */
export type ParentBindingHandler<T, C extends Record<string, any>> = (value: MaybeObservable<T>, pc: BindingContext<any>) => C
/** Binding handler `T`. Restricts to type binding handler. */
export type CustomBindingHandler<T extends (value: any, pc: BindingContext<any>) => Record<string, any> | void> = T

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
export interface BindingHandlers {
	visible: BindingHandler<boolean>
	hidden: BindingHandler<boolean>
	html: BindingHandler<boolean>
	class: BindingHandler<string>
	css: BindingHandler<string | object>
	style: BindingHandler<object>
	attr: BindingHandler<object>
	text: BindingHandler<string>
	foreach: CustomBindingHandler<<PC, T>(value: MaybeObservableArray<T> | { data: MaybeObservableArray<T>; as: string }, parentContext: PC) => BindingContext<T, PC>>
	if: BindingHandler<boolean>
	ifnot: BindingHandler<boolean>
	with: CustomBindingHandler<{
		<T extends object, P extends BindingContext<any>>(value: MaybeObservable<T>, parentContext: P): Overlay<P, T>
	}>
	using: BindingHandlers['with']
	let: CustomBindingHandler<{
		<T extends object, P extends BindingContext<any>>(value: MaybeObservable<T>, parentContext: P): Overlay<P, T>
	}>
	event: BindingHandler<WindowEventListenerMap>
	click: BindingHandler<(event: WindowEventListenerMap['click']) => any>
	submit: BindingHandler<(event: WindowEventListenerMap['submit']) => any>
	enable: BindingHandler<boolean>
	disable: BindingHandler<boolean>
	value: BindingHandler<any>
	textInput: BindingHandler<string>
	hasFocus: BindingHandler<() => any>
	checked: BindingHandler<boolean>
	checkedValue: BindingHandler<any>
	options: BindingHandler<string[]>
	selectedOptions: BindingHandler<string[]>
	uniqueName: BindingHandler<() => boolean>
	template: BindingHandler<string | ko.BindingTemplateOptions>
	component: BindingHandler<{
		name: any
		params: any
	}>
}

export * as ko from 'ko://knockout'
