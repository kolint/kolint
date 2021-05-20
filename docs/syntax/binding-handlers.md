# Bindinghandlers

## Defining & exporting bindinghandlers

All ES6 exports, exporting a class or a instance of a class are supported. The exports has to be done in a TypeScript file, if not `allowJs` is enabled in current tsconfig. The binding handler should implement the Knockout `BindingHandler` interface.

```typescript
class MyBindingHandler implements ko.BindingHandler<...> { ... }
ko.bindingHanders.myBindingHandler = new MyBindingHandler()

// ES6 class exports
export { MyBindingHandler }
export = MyBindingHandler
export default MyBindingHandler
```

### Transform Child Context

In the rare event the binding handler creates a new child context, the binding should specify the method `transformContext`.

```typescript
class BindingHandler implements ko.BindingHandler<...> {
  init(element, valueAccessor, allBindings, viewModel, bindingContext) {
    // Make a modified binding context, with a extra properties, and apply it to descendant elements
    const innerBindingContext = bindingContext.extend(valueAccessor);
    ko.applyBindingsToDescendants(innerBindingContext, element);

    // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
    return { controlsDescendantBindings: true };
  }

  transformContext!: (input: Input, context: ParentContext) => ChildContext
}
```

## Using bindinghandlers

If the bindinghandler is _not_ globally declared, the binding handler needs to be imported into the view using the same import syntax as for the viewmodels.

```html
<!-- ko-import { myBindinghandler } from './myBindinghandler' -->
<p data-bind="myBindinghandler: ...">
```
