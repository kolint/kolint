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

The syntax **will** change in the v1.0 release.

| View Syntax | Binding Handler Name | Binding Handler Export |
| :--- | :--- | :--- |
| `import bindinghandler from './bindinghandler'` | bindinghandler | `export default BindingHandler (interface/class)` |
| `import * as bindinghandler from './bindinghandler'` | bindinghandler | `export = BindingHandler (interface/class)` |
| `import { BindingHandler } from './bindinghandler'` | **B**inding**H**andler | `export { BindingHandler } (interface/class)` |
| `import { bh as bindinghandler } from './bindinghandler'` | bindinghandler | `export { BindingHandler as bh } (interface/class)` |
| `import typeof bindinghandler from './bindinghandler'` | bindinghandler | `export default bindingHandler (variable)` |
| `import typeof * as bindinghandler from './bindinghandler'` | bindinghandler | `export = bindingHandler (variable)` |
| `import { typeof bindinghandler } from './bindinghandler'` | bindinghandler | `export { bindinghandler } (variable)` |
| `import { typeof bh as bindinghandler } from './bindinghandler'` | bindinghandler | `export { bindingHandler as bh } (variable)` |

