import injectTypes from './type-injection'
import * as path from 'path'
import * as ts from 'typescript/lib/tsserverlibrary'

export class ScriptFile {
	public version: number
	public filePath: string
	public constructor(public fileName: string, viewPath: string, public data: string) {
		this.version = 1
		this.filePath = path.join(path.parse(viewPath).dir, fileName)
	}

	public static getPath(fileName: string, viewPath: string): string {
		return path.join(path.parse(viewPath).dir, fileName)
	}
}

export class Compiler {
	public scriptFiles: ScriptFile[] = []
	private service: ts.LanguageService

	public constructor(private viewPath: string) {
		const configFileName = ts.findConfigFile(path.parse(viewPath).dir, (p: string) => ts.sys.fileExists(path.resolve(path.parse(viewPath).dir, p)))

		let compilerOptions: ts.CompilerOptions

		if (configFileName) {
			const configFile = ts.readConfigFile(configFileName, (path: string, encoding?: string | undefined) => ts.sys.readFile(path, encoding))
			const args = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './')
			compilerOptions = args.options
		} else {
			compilerOptions = {}
		}

		const compilerHost = ts.createCompilerHost(compilerOptions)

		const getScriptFiles = () => this.scriptFiles

		const findScriptFile = (fileNameOrPath: string) => (file: ScriptFile) => file.filePath === fileNameOrPath || file.fileName === fileNameOrPath

		const host: ts.LanguageServiceHost = {
			getCompilationSettings: (): ts.CompilerOptions => compilerOptions,
			getScriptFileNames: (): string[] => getScriptFiles().map(file => file.filePath),
			getScriptVersion: (fileName: string): string => getScriptFiles().find(findScriptFile(fileName))?.version.toString() ?? '1',

			getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
				const data = getScriptFiles().find(findScriptFile(fileName))?.data ?? ts.sys.readFile(fileName) ?? ''
				return ts.ScriptSnapshot.fromString(data)
			},

			getCurrentDirectory: (): string => ts.sys.getCurrentDirectory(),
			getDefaultLibFileName: ts.getDefaultLibFilePath,

			readFile(filepath: string, encoding?: string): string | undefined {
				const file = getScriptFiles().find(findScriptFile(filepath))

				if (file)
					return file.data

				return ts.sys.readFile(filepath, encoding)
			},
			resolveModuleNames(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ts.ResolvedProjectReference | undefined, options: ts.CompilerOptions): (ts.ResolvedModuleFull | undefined)[] {
				const moduleResolutionCache = ts.createModuleResolutionCache(host.getCurrentDirectory(), x => x, options)

				const mods = moduleNames.map(moduleName => {
					{
						const matches = /^ko-view-lint:\/\/(.*)/.exec(moduleName)
						// TODO: use the absolute path to ko-view-lint libs here.
						if (matches)
							moduleName = path.resolve(__dirname, '../..', matches[1])
					}

					{
						const matches = /^ko:\/\/(.*)/.exec(moduleName)
						if (matches) {
							moduleName = path.join(__dirname, '../../node_modules/knockout/build/types', matches[1])
						}
					}
					return ts.resolveModuleName(moduleName, containingFile, options, compilerHost, moduleResolutionCache, redirectedReference).resolvedModule
				})

				return mods
			}
		}
		this.service = ts.createLanguageService(host, ts.createDocumentRegistry())
	}

	public compile(template: string, generatedFileName: string): string {
		this.scriptFiles.push(new ScriptFile('template.o.ts', this.viewPath, template))

		const tsProgram = this.service.getProgram()

		if (!tsProgram)
			throw new Error('Could not compile files')

		const source = tsProgram?.getSourceFile(ScriptFile.getPath('template.o.ts', this.viewPath))

		if (!source)
			throw new Error('Broken intermediate file')

		const generated = injectTypes(tsProgram, source, template)

		this.scriptFiles.push(new ScriptFile(generatedFileName, this.viewPath, generated))

		return generated
	}

	public getService(): ts.LanguageService {
		return this.service
	}

	public getSource(fileName: string): { program: ts.Program, source: ts.SourceFile, path: string } {
		const program = this.service.getProgram()

		if (!program)
			throw new Error('No program available')

		const source = program.getSourceFile(ScriptFile.getPath(fileName, this.viewPath))
		if (!source) throw new Error(`File ${fileName} doesn't exists`)

		return { program, source, path: ScriptFile.getPath(fileName, this.viewPath) }
	}
}
