[![npm version](https://img.shields.io/npm/v/knockout-lint.svg)](https://www.npmjs.com/package/knockout-lint)
[![Downloads](https://img.shields.io/npm/dm/knockout-lint.svg)](https://www.npmjs.com/package/knockout-lint)
[![License](https://img.shields.io/github/license/kolint/kolint.svg)](https://github.com/kolint/kolint/blob/master/LICENSE)

# KOLint

KOLint is a type checker and lint tool for [Knockout.JS](https://knockoutjs.com) views. [TypeScript](https://typescriptlang.org) is used for type checking the Knockout view bindings when the viewmodel is defined in Typescript. The tool also checks for common mistakes in Knockout views. See documentation at [GitHub Wiki](https://github.com/kolint/kolint/wiki).


## Try it out
1. Add reference to your view:
    ```html
    <!-- ko-import ViewModel from './viewmodel' -->
    <!-- ko-viewmodel ViewModel -->
    ```
2. Run KOLint without installing it:
    ```
    $ npx knockout-lint view.html
    ```
