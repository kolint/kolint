[![npm - knockout-lint](https://img.shields.io/badge/npm-knockout--lint-red?style=flat-square)](https://www.npmjs.com/package/knockout-lint)
[![GitHub - kolint](https://img.shields.io/badge/GitHub-kolint-blue?style=flat-square)](https://github.com/kolint/kolint)
[![LICENSE - MIT](https://img.shields.io/github/license/kolint/kolint.svg?style=flat-square)](https://github.com/kolint/kolint/blob/master/LICENSE)
[![npm - downloads](https://img.shields.io/npm/dw/knockout-lint?style=flat-square)](https://www.npmjs.com/package/knockout-lint)
[![npm - version](https://img.shields.io/npm/v/knockout-lint?style=flat-square)](https://github.com/kolint/kolint/releases)

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/kolint/kolint">
    <img src="https://github.com/kolint/kolint/raw/master/assets/logo.png" alt="Logo" width="72">
  </a>

  <h3 align="center">KOLint</h3>

  <p align="center">
    Lint knockout HTML files with included TypeScript compiler and type checker
    <br />
    <a href="https://github.com/kolint/kolint/wiki"><strong>Explore the wiki »</strong></a>
    <br />
    <br />
    <a href="#installation">Getting Started</a>
    <b>·</b>
    <a href="https://github.com/kolint/kolint/issues/new/choose">Report Bug</a>
    <b>·</b>
    <a href="https://github.com/kolint/kolint/blob/master/CONTRIBUTING.md">Contributing</a>
    <b>·</b>
    <a href="#roadmap">Roadmap</a>
  </p>
</p>

<br>

<!-- TABLE OF CONTENTS -->
<!-- omit in toc -->
## Table of Contents

- [About The Project](#about-the-project)
  - [Built with](#built-with)
- [Installation](#installation)
- [Usage](#usage)
  - [Using the CLI](#using-the-cli)
  - [Using the API](#using-the-api)
- [Roadmap](#roadmap)



<!-- ABOUT THE PROJECT -->
## About The Project

This project is a lint for the [Knockout](https://knockoutjs.com/) library. The lint includes the features to lint both the HTML and the Knockout bindings and compile and type check the bindings with the [TypeScript Compiler API][ts-compiler-api]. We mainly focus on keeping the lint fast to lint and type check. That is why we use our own parser for HTML only to parse the necessary nodes.

### Built with
  - [meriyah][meriyah] - A 100% compliant, self-hosted javascript parser. Has support for ES2020 and TypeScript syntax.
  - [TypeScript Compiler API][ts-compiler-api] - Superset of JavaScript that compiles to clean JavaScript output.
  - [jison][jison] - Generates bottom-up parsers in JavaScript. Its API is similar to Bison's.

## Installation

```
npm i -D knockout-lint
```

<!-- USAGE EXAMPLES -->
## Usage

**Note!** If you want to learn about the syntax used in views. Please refer to [the wiki](https://github.com/kolint/kolint/wiki) on GitHub.

### Using the CLI

**Installing npm globally**
```
npm i -g knockout-lint
```

**Running the CLI**

~Use `-c` or `--config` to specify a path to a config file. Default is `.kolintrc` or `.kolintrc.*`.~

```
knockout-lint views/**/*.html
```

### Using the API

```typescript
import * as kolint from 'knockout-lint';

// Creates a new program, can be used with multiple files.
const program = kolint.createProgram();

// Parsing a document
const document = program.parse(/* document text */);

// Compiling the document with built-in TypeScript compiler
const tsOut = program.typescriptCompiler.compile(/* document path */, document);

// Getting diagnostics from program and built-in TypeScript compiler
const diagnostics = program.diagnostics.concat(tsOut.getDiagnostics());
```

_For more information about the usage, please refer to the [Documentation](https://github.com/kolint/kolint/wiki)._



<!-- ROADMAP -->
## Roadmap

**Knockout TypeScript Decorators Support**

Our team will try to focus on getting support for TypeScript decorators as soon as possible. Check out the [Knockout](https://github.com/gnaeus/knockout-decorators) Decorators project.

**Knockout Support Extensions**

Linting and type checking views are quite remarkable, but not if it is not convenient. Therefore one of our goals is to make in-editor support for knockout in both Visual Studio Code and Visual Studio 2019. The extensions will include lint and type checking diagnostics visible in the text editor, autocompletion, IntelliSense, automatic importation of view models and binding handlers.

**Production compilation**

KOLint has some amazing features not used with its full potential. KOLint will always be focused on linting and type checking, but a feature project to be made is to compile the knockout bindings into JavaScript files. This has the advantages of:

1. Security — hackers will have a harder time getting any useful information from the bindings. Also, if using knockout 3.x or below, the code will not have to be evaluated.

2. Performance — knockout will not have to parse the JavaScript and bindings or evaluate them.

_See the [open issues](https://github.com/kolint/kolint/issues) for a list of proposed features and known issues_

<!-- omit in toc -->
###### This project is licensed under the MIT license. Go to [license](https://github.com/kolint/kolint/blob/master/LICENSE).

[ts-compiler-api]: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
[meriyah]: https://github.com/meriyah/meriyah
[jison]: https://github.com/zaach/jison
[product-screenshot]: images/screenshot.png


