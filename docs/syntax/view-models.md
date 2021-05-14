# Viewmodels

## Defining & exporting viewmodels

All ES6 exports, exporting a class or a instance of a class are supported. The exports has to be done in a TypeScript file, if not `allowJs` is enabled in current tsconfig.

```typescript
// ES6 class exports
export class ViewModel { ... }
export = class ViewModel { ... }
export default class ViewModel { ... }

// Singleton exports
export = new ViewModel()
export default new ViewModel()
```

## Using viewmodels

The `ko-import` directive uses the same syntax as ES6, but with a different prefix. The importing of the viewmodel is separate from the declaration of the viewmodel. The `ko-viewmodel` directive is used to set the current viewmodel. It can also be a globally defined type/interface/class.

{% hint style='tip' %}
The `ko-viewmodel` directive can be used multiple times in the same view to re-define the viewmodel.
{% endhint %}

```html
Class default import
<!-- ko-import ViewModel from './viewmodel' -->
<!-- ko-viewmodel ViewModel -->

Singleton typeof import
<!-- ko-import * as ViewModel from './viewmodel' -->
<!-- ko-viewmodel typeof ViewModel -->

Globally defined viewmodel
<!-- ko-viewmodel GobalViewModel -->
```
