import * as ts from 'typescript'
import * as path from 'path'

export interface CompilerHost {
	getCompilerOptions(): ts.CompilerOptions
	getSourceFile?(fileName: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void, shouldCreateNewSourceFile?: boolean): ts.SourceFile | undefined
	createTypescriptCompilerHost(compilerOptions: ts.CompilerOptions): ts.CompilerHost
}

export function createCompilerHost(): CompilerHost {
	return {
		getCompilerOptions(): ts.CompilerOptions {
			const configPath = process.cwd()
			const configFileName = ts.findConfigFile(configPath, (p: string) => ts.sys.fileExists(path.resolve(configPath, p)))
			let compilerOptions: ts.CompilerOptions
			if (configFileName) {
				const configFile = ts.readConfigFile(configFileName, (path: string, encoding?: string | undefined) => ts.sys.readFile(path, encoding))
				const args = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './')
				compilerOptions = args.options
			} else {
				compilerOptions = {}
			}
			return compilerOptions
		},

		createTypescriptCompilerHost(compilerOptions: ts.CompilerOptions) {
			return ts.createCompilerHost(compilerOptions)
		}
	}
}