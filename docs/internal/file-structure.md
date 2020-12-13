# File structure

| FLAG | MEANING |
| :- | :- |
| 🏳️ | generated file |
| 🏴‍☠️ | deprecated file |

<br>

```text
...
├── lib
│   ├── resources
│   │   ├── context.d.ts ----------- All of the typings used by the output
│   │   └── scaffold.ts              Scaffold used by the compiler
│   ├── config.schema.json --------- JSON schema for .kolintrc.json files              🏳️
│   ├── document-parser.d.ts         Declaration file for document-parser.js
│   ├── document-parser.js --------- Document parser, JISON output                     🏳️
│   ├── jison.d.ts                   Declaration file for JSION module
│   ├── knockout.d.ts -------------- Declaration file for ko://knockout                🏴‍☠️
│   └── nodejs.d.ts                  Declaration file for NodeJS
├── src
│   ├── cli
│   │   ├── cli.ts ----------------- CLI
│   │   └── config.ts                Config for CLI
│   ├── compiler
│   │   ├── compiler.ts ------------ Compiler
│   │   ├── emit.ts                  Emitter
│   │   ├── index.ts --------------- Index, Compiler                                   🏴‍☠️
│   │   ├── knockout.ts              Exports knockout module                           🏴‍☠️
│   │   └── type-injection.ts ------ Injects type to output, used by compiler
│   ├── parser
│   │   ├── binding-handlers.ts      Emitter and typings for binding handlers          🏴‍☠️
│   │   ├── bindingDOM.ts ---------- Classes for all DOM nodes
│   │   ├── compile-bindings.ts      Parses bindings into Binding[]
│   │   ├── document-builder.ts ---- Builds usable document from Node[]
│   │   ├── grammar.jison            JISON grammar
│   │   ├── index.ts --------------- Index, Parser                                     🏴‍☠️
│   │   ├── location.ts              Class for Location, Ranges and Coordinates
│   │   ├── parser-compiler.ts ----- Uses JISON to generate document-parser.js         🏴‍☠️
│   │   ├── parser.ts                Text document to node[] parser
│   │   ├── polyfill.ts ------------ Polyfills and polyfill types                      🏴‍☠️
│   ├── diagnostic.ts                Rules and Diagnostic class
│   ├── index.ts ------------------- Index
│   ├── program.ts                   Program and createProgram()
│   ├── utils.ts ------------------- Utility functions
```
