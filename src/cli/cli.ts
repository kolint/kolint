import * as lint from '..'
import * as fs from 'fs'
import * as path from 'path'

function log(relativeFilepath: string, diagnostics: lint.Diagnostic[]) {
	for (const diag of diagnostics) {
		console.log(`${relativeFilepath}${diag.location ? `:${diag.location.first_line}:${diag.location.first_column}` : ''}: ${diag.message}`)
	}
}

async function main() {
	const filename = process.argv[2]
	const filepath = path.join(process.cwd(), filename)
	const relativeFilepath = path.relative(process.cwd(), filepath)
	const textDoc = fs.readFileSync(filepath).toString()
	
	try {
		const program = lint.createProgram()
	
		const document = program.parse(textDoc)
		
		const typescriptEmit = await program.typescriptCompiler.compile(filepath, document)
		
		const diagnostics = new Array<lint.Diagnostic>().concat(
			typescriptEmit.getDiagnostics(),
			program.getDiagnostics()
		)

		log(relativeFilepath, diagnostics)
	} catch (err) {
		if (err instanceof lint.Diagnostic)
			log(relativeFilepath, [err])
		else
			throw err
	}
}

main()
