import * as lint from '..'
import * as fs from 'fs'
import * as path from 'path'

async function parse(filename: string) {
   const filepath = path.join(__dirname, filename)
   const textDoc = (await fs.promises.readFile(filepath)).toString()

   const program = lint.createProgram()

   const document = program.parse(textDoc)

   return { program, document, filepath }
}

async function compile(parse: { program: lint.Program, document: lint.Document, filepath: string }) {
   const typescriptEmit = await parse.program.typescriptCompiler.compile(parse.filepath, parse.document)

   void new Array<lint.Diagnostic>().concat(
      typescriptEmit.getDiagnostics(),
      parse.program.getDiagnostics()
   )
}

describe('Document parser', () => it('Should succesfully parse a complex html file into the document', async () => void await parse('resources/parseTests.html')))
describe('TypeScript compiler', () => it('Should succesfully emit and compile the typescript output file', async () => void await compile(await parse('resources/compileTests.html'))))
