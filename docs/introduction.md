# Introduction

KOLint is a lint tool for [Knockout.JS][ko]. It can catch syntax errors, it also has a built-in [TypeScript][ts] type checker that can be used on views to get type and syntax errors.

## Why?
Knockout has worked the same since 2010 and has never disappointed me. Due to it being a core library, it is compact, has cross-browser compatibility, and can be extended from parsing bindings differently and building view models with TypeScript decorators, to be used as a framework. The bindings works as simple as it gets using HTML attributes.

### Headline features

**Elegant dependency tracking** - automatically updates the right parts of your UI whenever your data model changes.

**Declarative bindings** - a simple and obvious way to connect parts of your UI to your data model. You can construct a complex dynamic UIs easily using arbitrarily nested binding contexts.

**Trivially extensible** - implement custom behaviors as new declarative bindings for easy reuse in just a few lines of code.

### Additional benefits

**Pure JavaScript library** - works with any server or client-side technology.

**Can be added on top of your existing web application** without requiring major architectural changes

**Compact** - around 13kb after gzipping

**Works on any mainstream browser** (IE 6+, Firefox 2+, Chrome, Safari, Edge, others)

**Comprehensive suite of specifications** (developed BDD-style) means its correct functioning can easily be verified on new browsers and platforms

Check out the demos at [Knockout.JS][ko] website.

[ko]: https://knockoutjs.com
[ts]: https://typescriptlang.org