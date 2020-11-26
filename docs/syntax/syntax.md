# View Syntax

## Defining View Models

Our recommended way to create view models is by exporting an ES6 class. This can also be done by making an interface for a JavaScript object etc.

```typescript
export default class ViewModel {
    export myPropery1 = ko.observable('string')
    export myPropery2 = ko.observable(123)
}
```

<!------------------------------------------------------------------------------------>

## Importing View Models

**Import view models by using the syntax `<!-- ko-bindinghandler: ... -->` replacing `...` with any of the imports below.** KOLint's view model imports works similarly to ESLint. Use the `typeof` idendentifier infront of a key to import the 'type of' a variable.

<div align="center"><i><sub>The syntax will change in the v1.0 release.</sub></i></div>

<table width="100%" align="center">
  <tr>
    <th>View Syntax</th>
    <th>View Model Export</th>
  </tr>
  <tr>
    <td><code>import default from './viewmodel'</code></td>
    <td><code>export default ViewModel</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import * from './viewmodel</code></td>
    <td><code>export = ViewModel</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import { ViewModel } from './viewmodel</code></td>
    <td><code>export { ViewModel }</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import { vm as ViewModel } from './viewmodel</code></td>
    <td><code>export { ViewModel as vm }</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import <b>typeof</b> default from './viewmodel'</code></td>
    <td><code>export default viewModel</code> (variable)</td>
  </tr>
  <tr>
    <td><code>import <b>typeof</b> * from './viewmodel'</code></td>
    <td><code>export = viewModel</code> (variable)</td>
  </tr>
  <tr>
    <td><code>import { <b>typeof</b> ViewModel } from './viewmodel'</code></td>
    <td><code>export { viewModel }</code> (variable)</td>
  </tr>
  <tr>
    <td><code>import { <b>typeof</b> vm as ViewModel } from './viewmodel'</code></td>
    <td><code>export { viewModel as vm }</code> (variable)</td>
  </tr>
</table>

<!------------------------------------------------------------------------------------>

## Defining Binding Handlers

This is done automatically by Knockout Lint. This is our recommended ways of defining binding handlers.

```typescript
type T = string

// Using an ES6 class

export default class BindingHandler extends ko.BindingHandler<T> {
    init(element: Element, valueAccessor: () => T) {
        ...
    }
}

// If defined the binding handler as JavaScript, using the ko.BindingHandler type

export default ko.BindingHandler<T>
```

### Controls Descendant Bindings

If the binding handler controls the descendant bindings, the binding should specify the method `transformContext` as shown.

```typescript
export default class BindingHandler extends ko.BindingHandler<unknown> {
    init(element: Element, valueAccessor: () => T) {
        ...
    }

    transformContext(input: <input>, context: <parent context>): <child context>
}
```
<!------------------------------------------------------------------------------------>

## Importing Binding Handlers

**Import binding handlers by using the syntax `<!-- ko-bindinghandler: ... -->` replacing `...` with any of the imports below.** KOLint's binding handler imports works identically with ESLint, but with one exception; using the `typeof` idendentifier infront of a key to import the 'type of' a variable.

<div align="center"><i><sub>The syntax will change in the v1.0 release.</sub></i></div>

<table width="100%" align="center">
  <tr>
    <th>View Syntax</th>
    <th>Binding Handler Name</th>
    <th>Binding Handler Export</th>
  </tr>
  <tr>
    <td><code>import bindinghandler from './bindinghandler'</code></td>
    <td>bindinghandler</td>
    <td><code>export default BindingHandler</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import * as bindinghandler from './bindinghandler'</code></td>
    <td>bindinghandler</td>
    <td><code>export = BindingHandler</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import { BindingHandler } from './bindinghandler'</code></td>
    <td><b>B</b>inding<b>H</b>andler</td>
    <td><code>export { BindingHandler }</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import { bh as bindinghandler } from './bindinghandler'</code></td>
    <td>bindinghandler</td>
    <td><code>export { BindingHandler as bh }</code> (interface/class)</td>
  </tr>
  <tr>
    <td><code>import typeof bindinghandler from './bindinghandler'</code></td>
    <td>bindinghandler</td>
    <td><code>export default bindingHandler</code> (variable)</td>
  </tr>
  <tr>
    <td><code>import typeof * as bindinghandler from './bindinghandler'</code></td>
    <td>bindinghandler</td>
    <td><code>export = bindingHandler</code> (variable)</td>
  </tr>
  <tr>
    <td><code>import { typeof bindinghandler } from './bindinghandler'</code></td>
    <td>bindinghandler</td>
    <td><code>export { bindinghandler }</code> (variable)</td>
  </tr>
  <tr>
    <td><code>import { typeof bh as bindinghandler } from './bindinghandler'</code></td>
    <td>bindinghandler</td>
    <td><code>export { bindingHandler as bh }</code> (variable)</td>
  </tr>
</table>