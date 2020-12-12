# Installation

## Installation

**Note!** If you want to learn about the syntax used in views, refer to the \[syntax\]\[syntax\] documentation.

```bash
npm i -D knockout-lint
```

## Using the CLI

### Installing npm globally \(optional\)

```bash
npm i -g knockout-lint
```

### Running the CLI

Use -c or --config to specify a path to a config file. Default is .kolintrc or .kolintrc.\*.

```bash
knockout-lint views/**/*.html
```

## Using the API

```typescript
import * as kolint from 'knockout-lint';
​
// Creates a new program, can be used with multiple files.
const program = kolint.createProgram();
​
// Parsing a document
const document = program.parse(/* document text */);
​
// Compiling the document with built-in TypeScript compiler
const tsOut = program.compile(/* document path */, document);
​
// Getting diagnostics from program and built-in TypeScript compiler
const diagnostics = program.diagnostics.concat(tsOut.getDiagnostics());
```

\[syntax\]: ../syntax/view-models.md

