<!-- [![LICENSE - MIT](https://img.shields.io/github/license/knockout-lint/knockout-lint.svg?style=flat-square)](https://github.com/knockout-lint/knockout-lint/blob/master/LICENSE) -->

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/knockout-lint/knockout-lint">
    <img src="assets/logo.png" alt="Logo" width="72">
  </a>

  <h3 align="center">Knockout Lint</h3>

  <p align="center">
    Lint knockout HTML files with included TypeScript compiler and type checker
    <br />
    <a href="https://github.com/knockout-lint/knockout-lint"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#installation">Getting Started</a>
    <b>·</b>
    <a href="#roadmap">Roadmap</a>
    <b>·</b>
    <a href="https://github.com/knockout-lint/knockout-lint/issues/new">Report Bug</a>
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
  - [acorn][acorn] - A small, fast, JavaScript-based JavaScript parser <!--[meriyah][meriyah] - A 100% compliant, self-hosted javascript parser. Supports ES2020 syntax.-->
  - [TypeScript Compiler API][ts-compiler-api] - Superset of JavaScript that compiles to clean JavaScript output.
  - [jison][jison] - Generates bottom-up parsers in JavaScript. Its API is similar to Bison's.

## Installation

```
npm i -D NPM_PACKAGE_NAME
```

<!-- USAGE EXAMPLES -->
## Usage

How to setup Knockout Lint to work locally.

### Using the CLI

**Installing npm globally**
```
npm i -g NPM_PACKAGE_NAME
```

**Running the CLI**

Use `-c` or `--config` to specify a path to a config file. Default is `.kolintrc` or `.kolintrc.*`.

```
NPM_PACKAGE_NAME views/**/*.html
```

### Using the API

```typescript
import * as kolint from 'NPM_PACKAGE_NAME';

// Creates a new program, can be used with multiple files.
const program = kolint.createProgram();

// Parsing a document
const document = program.parse(/* document text */);

// Compiling the document with built-in TypeScript compiler
const tsOut = program.typescriptCompiler.compile(/* document path */, document);

// Getting diagnostics from program and built-in TypeScript compiler
const diagnostics = program.diagnostics.concat(tsOut.getDiagnostics());
```

_For more information about the usage, please refer to the [Documentation](https://github.com/knockout-lint/knockout-lint/wiki)._



<!-- ROADMAP -->
## Roadmap

**Production compilation**

Knockout Lint has some amazing features not used with its full potential. Knockout Lint will always be focused on linting and type checking, but a feature project to be made is to compile the knockout bindings into JavaScript files. This has the advantages of:

1. Security — hackers will have a harder time getting any useful information from the bindings. Also, if using knockout 3.x or below, the code will not have to be evaluated.

2. Performance — knockout will not have to parse the JavaScript and bindings or evaluate them.

_See the [open issues](https://github.com/knockout-lint/knockout-lint/issues) for a list of proposed features and known issues_

<!-- omit in toc -->
###### This project is licensed under the MIT license. Go to [license](https://github.com/knockout-lint/knockout-lint/blob/master/LICENSE).

[ts-compiler-api]: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API
[meriyah]: https://github.com/meriyah/meriyah
[acorn]: https://github.com/acornjs/acorn
[jison]: https://github.com/zaach/jison
[product-screenshot]: images/screenshot.png


