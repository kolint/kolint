import * as ts from 'typescript'

/**
 * Takes the extracted binding code generated from the view
 * and adds context and $data members to the scope.
 * @returns Type decorated version of the input
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function injectTypes(tsProgram: ts.Program, source: ts.SourceFile, template: string): string {
	const checker = tsProgram.getTypeChecker()

	const modifications: { line: number, content: string }[] = []

	function replacePlaceholders(_node: ts.Node) {
		for (const node of _node.getChildren()) {
			if (node && ts.isIdentifier(node) && (node.escapedText === 'data_placeholder' || node.escapedText === 'context_placeholder')) {

				const props = getTypeProperties(node, checker)

				const start = ts.getLineAndCharacterOfPosition(source, node.getStart())
				const end = ts.getLineAndCharacterOfPosition(source, node.getEnd()).character

				const line = template.split('\n')[start.line]

				modifications.push({
					line: start.line,
					content: line.slice(0, start.character) + `{ ${props.join(', ')} }` + line.slice(end)
				})
			}

			replacePlaceholders(node)
		}
	}

	replacePlaceholders(source)

	const lines = template.split('\n')

	for (const mod of modifications.sort((a, b) => b.line - a.line))
		lines[mod.line] = mod.content

	template = lines.join('\n')

	return template
}

function getTypeProperties(node: ts.Node, checker: ts.TypeChecker): string[] {
	return checker.getPropertiesOfType(checker.getTypeAtLocation(node))
		.filter(symbol => !symbol.valueDeclaration?.modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword || modifier.kind === ts.SyntaxKind.PrivateKeyword))
		.map(symbol => symbol.getName())
}
