# Introduction

KOLint is a type checker and lint tool for [Knockout.JS](https://knockoutjs.com) views. [TypeScript](https://typescriptlang.org) is used for type checking the Knockout view bindings when the viewmodel is defined in Typescript. The tool also checks for common mistakes in Knockout views.

{% hint style='danger' %}
KOLint is named [knockout-lint](https://npmjs.com/package/knockout-lint) on npm. Not to be confused with the unrealted "kolint" package on npm.
{% endhint %}

## Example usage

This simple example showcases three TypeScript errors.

```typescript
export default class {
  // Should be a boolean
  isVisible = 0
  // Mispelled in view
  myText = 'hello world'
  // Should be a string (20px)
  myWidth = 20
}
```
```html
<!-- ko-import vm from './viewmodel' -->
<!-- ko-viewmodel vm -->
<p data-bind="visible: isVisible, text: myTest, style: { width: myWidth }"></p>
```
```
$ kolint ./view.html

./view.html(3:23) error TS2345 Argument of type 'number' is not assignable to parameter of type 'MaybeReadonlyObservable<boolean>'.
./view.html(3:40) error TS2552 Cannot find name 'myText'. Did you mean 'myTest'?
./view.html(3:55) error TS2345 Argument of type '{ width: number; }' is not assignable to parameter of type 'MaybeReadonlyObservable<Record<string, MaybeReadonlyObservable<string>>>'.

✖ 3 problems (3 errors, 0 warnings)
```
