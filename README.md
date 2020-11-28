<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/kolint/kolint">
    <img src="https://github.com/kolint/kolint/raw/master/assets/logo.png" alt="Logo" width="72">
  </a>

  <h3 align="center">KOLint</h3>

  <p align="center">
    <strong>TypeScript</strong> type check Knockout HTML files using view models
    <br />
    <a href="https://docs.kolint.org"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#installation">Getting Started</a>
    <b>·</b>
    <a href="https://github.com/kolint/kolint/issues/new/choose">Report Bug</a>
    <b>·</b>
    <b><a href="https://kolint.org">Website</a></b>
    <b>·</b>
    <a href="https://github.com/kolint/kolint/blob/master/CONTRIBUTING.md">Contributing</a>
    <b>·</b>
    <a href="#roadmap">Roadmap</a>
  </p>
</p>

<p align="center">
<a href="https://github.com/kolint/kolint/releases"><img src="https://img.shields.io/npm/v/knockout-lint?style=flat-square" alt="npm - version"></a>
<a href="https://app.codacy.com/gh/kolint/kolint?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=kolint/kolint&amp;utm_campaign=Badge_Grade_Settings"><img src="https://api.codacy.com/project/badge/Grade/55445591f0a1422484fba50da71aef79" alt="Codacy Badge"></a>
<a href="https://www.npmjs.com/package/knockout-lint"><img src="https://img.shields.io/badge/npm-knockout--lint-red?style=flat-square" alt="npm - knockout-lint"></a>
<a href="https://github.com/kolint/kolint"><img src="https://img.shields.io/badge/GitHub-kolint-blue?style=flat-square" alt="GitHub - kolint"></a>
<a href="https://github.com/kolint/kolint/blob/master/LICENSE"><img src="https://img.shields.io/github/license/kolint/kolint.svg?style=flat-square" alt="LICENSE - MIT"></a>
<a href="https://www.npmjs.com/package/knockout-lint"><img src="https://img.shields.io/npm/dw/knockout-lint?style=flat-square" alt="npm - downloads"></a>
</p>

<br>

<!-- ABOUT THE PROJECT -->
## About The Project

KOLint is a lint tool for Knockout.JS. It can catch syntax errors, it also has a built-in TypeScript type checker that can be used on views to get type and TypeScript syntax errors.

### Built with
  - [meriyah][meriyah] - A 100% compliant, self-hosted javascript parser. Has support for ES2020 and TypeScript syntax.
  - [TypeScript Compiler API][ts-compiler-api] - Superset of JavaScript that compiles to clean JavaScript output.
  - [jison][jison] - Generates bottom-up parsers in JavaScript. Its API is similar to Bison's.

## Why?

Knockout has worked the same since 2010 and has never disappointed me. Due to it being a core library, it is compact, has cross-browser compatibility, and can be extended from parsing bindings differently and building view models with TypeScript decorators, to be used as a framework. The bindings works as simple as it gets using HTML attributes.

Headline features:

- **Elegant dependency tracking** - automatically updates the right parts of your UI whenever your data model changes.
- **Declarative bindings** - a simple and obvious way to connect parts of your UI to your data model. You can construct a complex dynamic UIs easily using arbitrarily nested binding contexts.
- **Trivially extensible** - implement custom behaviors as new declarative bindings for easy reuse in just a few lines of code.

Additional benefits:
- **Pure JavaScript library** - works with any server or client-side technology.
- **Can be added on top of your existing web application** without requiring major architectural changes
- **Compact** - around 13kb after gzipping
- **Works on any mainstream browser** (IE 6+, Firefox 2+, Chrome, Safari, Edge, others)
- **Comprehensive suite of specifications** (developed BDD-style) means its correct functioning can easily be verified on new browsers and platforms

Check out the demos at [Knockout.JS](https://knockoutjs.com) website.

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


