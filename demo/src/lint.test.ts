import * as lint from '../../build'
import * as path from 'path'
import * as fs from 'fs'
 
function log(relativeFilepath: string, diagnostics: readonly lint.Diagnostic[]) {
	if (diagnostics.length <= 0) {
		console.log('[No errors]\n')

		return
	}

	for (const diag of diagnostics)
		console.log(`${relativeFilepath}${diag.location ? `:${diag.location.coords?.first_line}:${diag.location.coords?.first_column}` : ''}: ${diag.message}`)

	console.log('')
}

async function main() {
	const filename = path.join(__dirname, '../resources/view.html')
	const relFilename = path.relative(process.cwd(), filename).replace(/\\/g, '/')
	const textDoc = fs.readFileSync(filename).toString()
	if (!textDoc)
		throw new Error(`Cannot open file '${filename}'`)

	try {
		const program = lint.createProgram()
		const document = program.parse(textDoc)
		const fileHost = new lint.MemoryFileHost();
		await program.compile(filename, document, fileHost, textDoc)

		const diagnostics = program.getDiagnostics()

		if (!fs.existsSync(path.join(__dirname, '../temp')))
			fs.mkdirSync(path.join(__dirname, '../temp'))

		log(relFilename, diagnostics)
	} catch (err) {
		if (err instanceof lint.Diagnostic)
			log(relFilename, [err])
		else
			throw err
	}
}

main()
