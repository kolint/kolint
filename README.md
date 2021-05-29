[![npm version](https://img.shields.io/npm/v/knockout-lint.svg)](https://www.npmjs.com/package/knockout-lint)
[![Downloads](https://img.shields.io/npm/dm/knockout-lint.svg)](https://www.npmjs.com/package/knockout-lint)
[![License](https://img.shields.io/github/license/kolint/kolint.svg)](https://github.com/kolint/kolint/blob/master/LICENSE)

# KOLint

**KOLint is named [knockout-lint](https://npmjs.com/package/knockout-lint) on npm. Not to be confused with the unrealted "kolint" package on npm.**

KOLint is a type checker and lint tool for [Knockout.JS](https://knockoutjs.com) views. [TypeScript](https://typescriptlang.org) is used for type checking the Knockout view bindings when the viewmodel is defined in Typescript. The tool also checks for common mistakes in Knockout views. See documentation at [docs.kolint.org](https://docs.kolint.org).

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

## Roadmap

**Production compilation**

KOLint has some amazing features not used with its full potential. KOLint will always be focused on linting and type checking, but a feature project to be made is to compile the knockout bindings into bundled JavaScript files. This has the advantages of:

1. Security — hackers will have a harder time getting any useful information from the bindings. Also, if using knockout 3.x or below, the code will not have to be evaluated.

2. Performance — knockout will not have to parse the JavaScript and bindings or evaluate them.
