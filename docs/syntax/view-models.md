# View Models

## Defining View Models

Our recommended way to create view models is by exporting an ES6 class. This can also be done by making an interface for a JavaScript object, etc.

```typescript
export default class ViewModel {
  export myPropery1 = ko.observable('string')
  export myPropery2 = ko.observable(123)
}
```

## Importing View Models

**Import view models by using the syntax `<!-- ko-bindinghandler: ... -->` replacing `...` with any of the imports below.** KOLint's view model imports works similarly to ESLint. Use the typeof identfier in front of a key to import the 'type of' a variable.

The syntax **will** change in the v1.0 release.

| View Syntax | View Model Export |
| :--- | :--- |
| `import default from './viewmodel'` | `export default ViewModel (interface/class)` |
| `import * from './viewmodel` | `export = ViewModel (interface/class)` |
| `import { ViewModel } from './viewmodel` | `export { ViewModel } (interface/class)` |
| `import { vm as ViewModel } from './viewmodel` | `export { ViewModel as vm } (interface/class)` |
| `import typeof default from './viewmodel'` | `export default viewModel (variable)` |
| `import typeof * from './viewmodel'` | `export = viewModel (variable)` |
| `import { typeof ViewModel } from './viewmodel'` | `export { viewModel } (variable)` |
| `import { typeof vm as ViewModel } from './viewmodel'` | `export { viewModel as vm } (variable)` |

