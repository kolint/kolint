# Binding Handlers

## Defining Binding Handlers

Our recommended way to create binding handler is by exporting an ES6 class. This can also be done by making an interface for a JavaScript object, etc.

```typescript
type T = string
​
// Using an ES6 class
export default class BindingHandler extends ko.BindingHandler<T> {
  init(element: Element, valueAccessor: () => T) {
    ...
  }
}
​
// If defined the binding handler as JavaScript, using the ko.BindingHandler type
export default ko.BindingHandler<T>
```

### Controls Descendant Bindings
If the binding handler controls the descendant bindings, the binding should specify the method transformContext as shown.

```typescript
export default class BindingHandler extends ko.BindingHandler<unknown> {
  init(element: Element, valueAccessor: () => T) {
    ...
  }
​
  transformContext(input: <input>, context: <parent context>): <child context>
}
```

## Importing Binding Handlers
**Import binding handlers by using the syntax `<!-- ko-bindinghandler: ... -->` replacing `...` with any of the imports below.** KOLint's binding handler imports work identically with ESLint, but with one exception; using the typeof identfier in front of a key to import the 'type of' a variable.

<p align="center"><i><sub>The syntax <strong>will</strong> change in the v1.0 release.</sub></i></p>

<table>
  <tr>
    <th>View Syntax</th>
    <th>Binding Handler Name</th>
    <th>Binding Handler Export</th>
  </tr>
  <tr>
  	<td><code>import bindinghandler from './bindinghandler'</code></td>
  	<td>bindinghandler</td>
  	<td><code>export default BindingHandler (interface/class)</code></td>
  </tr>
  <tr>
  	<td><code>import * as bindinghandler from './bindinghandler'</code></td>
  	<td>bindinghandler</td>
  	<td><code>export = BindingHandler (interface/class)</code></td>
  </tr>
  <tr>
  	<td><code>import { BindingHandler } from './bindinghandler'</code></td>
  	<td><strong>B</strong>inding<strong>H</strong>andler</td>
  	<td><code>export { BindingHandler } (interface/class)</code></td>
  </tr>
  <tr>
  	<td><code>import { bh as bindinghandler } from './bindinghandler'</code></td>
  	<td>bindinghandler</td>
  	<td><code>export { BindingHandler as bh } (interface/class)</code></td>
  </tr>
  <tr>
  	<td><code>import typeof bindinghandler from './bindinghandler'</code></td>
  	<td>bindinghandler</td>
  	<td><code>export default bindingHandler (variable)</code></td>
  </tr>
  <tr>
  	<td><code>import typeof * as bindinghandler from './bindinghandler'</code></td>
  	<td>bindinghandler</td>
  	<td><code>export = bindingHandler (variable)</code></td>
  </tr>
  <tr>
  	<td><code>import { typeof bindinghandler } from './bindinghandler'</code></td>
  	<td>bindinghandler</td>
  	<td><code>export { bindinghandler } (variable)</code></td>
  </tr>
  <tr>
  	<td><code>import { typeof bh as bindinghandler } from './bindinghandler'</code></td>
  	<td>bindinghandler</td>
  	<td><code>export { bindingHandler as bh } (variable)</code></td>
  </tr>
</table>