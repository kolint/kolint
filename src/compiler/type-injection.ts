import * as ts from 'typescript'
import { isReserved } from '../utils'

// TODO: fix the API. returning a string with the last file name has not very obvious semantics.
/**
 * Iterativaly fills out all $context_placeholder and $data_placeholders with the deconstructed members.
 * The inferred types gives us all available properties for each context in the view.
 */
export async function injectContextTypes(compiledViewPath: string, compilerHost: ts.CompilerHost, compilerOptions: ts.CompilerOptions, writeFileCallback: (data: ts.SourceFile, oldfilename: string, newfilename: string) => Promise<void>): Promise<string> {
	let counter = 0
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const previousFileName = `${compiledViewPath}_${counter}.ts`
		const nextFileName = `${compiledViewPath}_${++counter}.ts`
		const program = ts.createProgram([previousFileName], compilerOptions, compilerHost)
		const typedFile = program.getSourceFile(previousFileName)
		if (!typedFile)
			throw new Error('fail')
		const injector = new TypeInjector(program)
		const finalResult = ts.transform(typedFile, [injector.transformerFactory], compilerOptions)
		await writeFileCallback(finalResult.transformed[0], previousFileName, nextFileName)

		if (injector.replaceCount === 0 && injector.totalCount > 0) {
			// TODO: Handle this case more gracefully
			// If types are not exported correctly, we will not be able to infer the correct type.
			program.getDeclarationDiagnostics().forEach(diag => console.log(diag.messageText))
		}
		if (injector.replaceCount === injector.totalCount)
			return nextFileName // All done
		if (!injector.replaceCount)
			return nextFileName // Could not process all contexts
	}
}

class TypeInjector {
	private checker: ts.TypeChecker
	public replaceCount = 0;
	public totalCount = 0;

	public constructor(program: ts.Program) {
		this.checker = program.getTypeChecker()
	}

	public transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
		const childVisitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
			if (ts.isIdentifier(node)) {
				switch (node.escapedText) {
					case '$data_placeholder':
					case '$context_placeholder':
						return this.replacePlaceholders(node, context.factory)
				}
			}
			return ts.visitEachChild(node, childVisitor, context)
		}
		return (file) => ts.visitEachChild(file, childVisitor, context)
	}

	private static getTypeProperties(node: ts.Node, checker: ts.TypeChecker): string[] {
		return checker.getPropertiesOfType(checker.getTypeAtLocation(node))
			.filter(symbol => !symbol.valueDeclaration?.modifiers?.find(modifier => modifier.kind === ts.SyntaxKind.ProtectedKeyword || modifier.kind === ts.SyntaxKind.PrivateKeyword))
			.map(symbol => symbol.getName())
	}

	private replacePlaceholders(childNode: ts.Node, factory: ts.NodeFactory): ts.Node[] | ts.Node | undefined {
		++this.totalCount
		const props = TypeInjector.getTypeProperties(childNode, this.checker)
		const elements = props.
			filter(prop => /^[$a-zA-Z_][$a-zA-Z0-9_]*$/.test(prop) && !isReserved(prop)) // Some object identifiers are not legal as local variable names
		const e2 = elements.
			map(prop => factory.createBindingElement(undefined, undefined, factory.createIdentifier(prop), undefined))
		if (e2?.length > 0) {
			++this.replaceCount
			return factory.createObjectBindingPattern(e2)
		}
		return childNode
	}
}
