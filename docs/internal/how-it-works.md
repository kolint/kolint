# How it works

## Program

The program keeps track of diagnostics, rules, and if or what rules are disabled. The program is also a portal to the parser and compiler.

## Parser

### View Parser

The custom view (HTML/XML) parser is built with [jison](https://github.com/zaach/jison). All of the grammar used to parse the view is located at `src/parser/grammar.jison`. It parses all elements into nodes with the bindings (may be empty).

### Binding Parser

The binding parser parses all binding attributes from the nodes into `Binding[]`. The binding attribute content is placed inside two brackets and parsed using [meriyah](https://github.com/meriyah/meriyah).

## Compiler

The generated code is built of a **scaffold** located at `lib/resources/scaffold.ts`. The scaffold is essentially being more and more replaced by the generated code.

The **context declaration** file is located at `lib/resources/context.d.ts` and is imported by the generated code. It contains all of the typings and interfaces needed by the generated code.

The **type injection** occurs after the code has been generated, during the code compilation. It replaces all placeholders with identifiers inferred by [typescript](https://github.com/microsoft/typescript).

The end to end **source map** are built using [typescript](https://github.com/microsoft/typescript). They are made while generating the output.

## CLI

The Command Line Interface is a CLI wrapper included with the `knockout-lint` package.
