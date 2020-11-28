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

<p align="center"><i><sub>The syntax <strong>will</strong> change in the v1.0 release.</sub></i></p>

<table width="100%" align="center">
  <tr>
    <th>View Syntax</th>
    <th>View Model Export</th>
  </tr>
  <tr>
    <td><code>import default from './viewmodel'</code></td>
    <td><code>export default ViewModel (interface/class)</code></td>
  </tr>
  <tr>
    <td><code>import * from './viewmodel</code></td>
    <td><code>export = ViewModel (interface/class)</code></td>
  </tr>
  <tr>
    <td><code>import { ViewModel } from './viewmodel</code></td>
    <td><code>export { ViewModel } (interface/class)</code></td>
  </tr>
  <tr>
    <td><code>import { vm as ViewModel } from './viewmodel</code></td>
    <td><code>export { ViewModel as vm } (interface/class)</code></td>
  </tr>
  <tr>
    <td><code>import typeof default from './viewmodel'</code></td>
    <td><code>export default viewModel (variable)</code></td>
  </tr>
  <tr>
    <td><code>import typeof * from './viewmodel'</code></td>
    <td><code>export = viewModel (variable)</code></td>
  </tr>
  <tr>
    <td><code>import { typeof ViewModel } from './viewmodel'</code></td>
    <td><code>export { viewModel } (variable)</code></td>
  </tr>
  <tr>
    <td><code>import { typeof vm as ViewModel } from './viewmodel'</code></td>
    <td><code>export { viewModel as vm } (variable)</code></td>
  </tr>
</table>
