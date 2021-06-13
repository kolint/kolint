// src
export { Diagnostic, Severity, diagnostics, DiagnosticDescription } from './diagnostic'
export { createProgram, Program, Reporting } from './program'
export { utils } from './utils'

// src/cli
export { ConfigOptions } from './cli'

// src/compiler
export { Compiler, createCompiler } from './compiler'
export { CompilerHost, createCompilerHost } from './compiler/compiler-host'

// src/parser
export { parse } from './parser'
export { createDocument } from './parser/document-builder'
export { Coordinates, Location, Position } from './parser/location'
export * from './parser/syntax-tree'
