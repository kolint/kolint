# Installation

**Note!** If you want to learn about the syntax used in views, refer to [the view syntax](../syntax/syntax.md) dcoumentation.

```
npm i -D knockout-lint
```

### Using the CLI

**Installing npm globally** (optional)
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

### View Syntax

KOLint requires syntax in all view files to know where to import view model and binding handlers from. Learn about more about [the view syntax](../syntax/syntax.md).
