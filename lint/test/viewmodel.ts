import * as ko from 'knockout'

export interface koko extends ko.BindingHandler<unknown> {
	init: (element: HTMLElement, valueAccessor: () => string, allBindings: ko.AllBindings, viewModel: unknown, bindingContext: ko.BindingContext<unknown>) => void;
	update: (element: HTMLElement, valueAccessor: () => number, allBindings: ko.AllBindings, viewModel: unknown, bindingContext: ko.BindingContext<unknown>) => void;
}

export default class Kokomodel {
	prop = 'yay'
}