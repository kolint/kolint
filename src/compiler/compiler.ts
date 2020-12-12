/* eslint-disable @typescript-eslint/unbound-method */
import * as path from 'path'
import * as ts from 'typescript'
import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map'
import { injectContextTypes } from './type-injection'
import { ViewBindingsEmitter, ViewBindingsEmitterOptions } from './emit'
import { Document } from '../parser'
import { FileHost } from '../program'

interface TextWriter {
	getTextPos(): number
	getText(): string
}

/** Horrible Hack: We are exposing one of the internal typescript API methods to be able to print out typescript from AST's with SourceMaps */
interface ts2 {
	createTextWriter(newLine: string): TextWriter
	// createSourceMapGenerator(host: ts.EmitHost, file: string, sourceRoot: string, sourcesDirectoryPath: string, generatorOptions: SourceMapGeneratorOptions): SourceMapGenerator
}

interface InternalPrinter extends ts.Printer {
	writeFile(sourceFile: ts.SourceFile, output: TextWriter, sourceMapGenerator: SourceMapAdapter | undefined): void
}

interface LineAndCharacter {
	line: number
	character: number
}

/** The SourceMapAdapter implements the source map interface that typescript expects, but we are using our
 * own source-map library. (We need to do this since the typescript internal sourcemap in itself would
 * require us to create an even more advanced wrapper for the TextWriter instead.)  */
class SourceMapAdapter {
	private sm: SourceMapGenerator
	private sources: string[] = []
	private names: string[] = []

	public constructor(generatedFileName: string) {
		this.sm = new SourceMapGenerator({
			file: generatedFileName
		})
	}

	public addMapping(line: number, column: number, sourceMapSourceIndex: number, sourceLine: number, sourceColumn: number, nameIndex: number | undefined): void {
		this.sm.addMapping({
			original: {
				line: sourceLine + 1,
				column: sourceColumn
			},
			generated: {
				line: line + 1,
				column: column
			},
			source: this.sources[sourceMapSourceIndex],
			name: nameIndex ? this.names[nameIndex] : undefined
		})
	}
	public addSource(filename: string): number {
		const idx = this.sources.findIndex(source => source === filename)
		if (idx >= 0)
			return idx
		this.sources.push(filename)
		return this.sources.length - 1
	}

	public getSources(): string[] {
		return this.sources
	}

	public setSourceContent(sourceIndex: number, content: string | null): void {
		if (!content)
			return
		this.sm.setSourceContent(this.sources[sourceIndex], content)
	}

	public addName(name: string): number {
		const idx = this.names.findIndex(name => name === name)
		if (idx >= 0)
			return idx
		this.names.push(name)
		return this.names.length - 1
	}

	public appendSourceMap(_generatedLine: number, _generatedCharacter: number, _map: RawSourceMap, _sourceMapPath: string, _start?: LineAndCharacter, _end?: LineAndCharacter): void {
		throw new Error('appendSourceMap is not yet supported')
	}

	public toJSON() {
		return this.sm.toJSON()
	}

	public toString() {
		return this.sm.toString()
	}

	/**
	 * When dealing with multiple stepf of transformations we need to make sure that the
	 * source map correctly points to the original source locations. Therefore, we can base
	 * our sourcemap on the previous souce map.
	 * @param oldRawSourceMap Sourcemap to base our sourcemap on
	 */
	public async mergeSourceMaps(oldRawSourceMap: RawSourceMap): Promise<void> {
		const consumer = await new SourceMapConsumer(oldRawSourceMap)
		this.sm.applySourceMap(consumer)
		consumer.destroy()
	}
}

export type CompilerOptions = ViewBindingsEmitterOptions

export class Compiler {
	private static getStandardOptions(viewPath: string): ts.CompilerOptions {
		const configFileName = ts.findConfigFile(path.parse(viewPath).dir, (p: string) => ts.sys.fileExists(path.resolve(path.parse(viewPath).dir, p)))
		let compilerOptions: ts.CompilerOptions
		if (configFileName) {
			const configFile = ts.readConfigFile(configFileName, (path: string, encoding?: string | undefined) => ts.sys.readFile(path, encoding))
			const args = ts.parseJsonConfigFileContent(configFile.config, ts.sys, './')
			compilerOptions = args.options
		} else {
			compilerOptions = {}
		}
		return compilerOptions
	}

	public constructor(private fileHost: FileHost, private options?: CompilerOptions | undefined) {}

	public async compile(document: Document, viewPath: string, viewContent: string): Promise<{ source: ts.SourceFile, diagnostics: readonly ts.Diagnostic[] }> {
		const typeLibPath = path.resolve(__dirname, '../../lib/resources/context')
		const compilerOptions = Compiler.getStandardOptions(path.resolve(viewPath))

		const writeSourceFile = async (file: ts.SourceFile, previousFileName: string | undefined, tsFileName: string) => {
			const sm = new SourceMapAdapter(tsFileName)

			// We are exposing unofficial API's to be able to emit TS backed with Source Maps
			const unofficialAPI = ts as unknown as ts2
			const textWriter = unofficialAPI.createTextWriter(ts.sys.newLine)
			const printer = ts.createPrinter({ removeComments: false }) as InternalPrinter
			printer.writeFile(file, textWriter, sm)
			this.fileHost.writeFile(tsFileName, textWriter.getText())

			// Inject the previous source map to make our new source map to point to the original source
			if (previousFileName) {
				const oldMap = JSON.parse(this.fileHost.readFile(previousFileName + '.map') ?? '') as RawSourceMap
				await sm.mergeSourceMaps(oldMap)
			}
			this.fileHost.writeFile(tsFileName + '.map', sm.toString())
		}

		// Load scaffold into a source file
		const templateFile = path.join(__dirname, '../../lib/resources/scaffold.ts')
		const text = ts.sys.readFile(templateFile)
		if (!text)
			throw new Error('Could not load template file')
		const scaffoldFile = ts.createSourceFile(templateFile, text, ts.ScriptTarget.ES2018)

		// Generate Source Map based on the Html View (Precompiled View -> Html View)
		const sourceMapSource = ts.createSourceMapSource(viewPath, viewContent)

		// Transform the AST Fill out the placeholders with data form the view.
		const emitter = new ViewBindingsEmitter(document, ts.factory, typeLibPath, sourceMapSource, this.options)
		const result = ts.transform(scaffoldFile, [emitter.transformerFactory], compilerOptions)

		const compiledViewPath = viewPath + '.g'
		await writeSourceFile(result.transformed[0], undefined, compiledViewPath + '_0.ts')

		const compilerHost = ts.createCompilerHost(compilerOptions)
		compilerHost.readFile = (fileName: string) => {
			const data = this.fileHost.readFile(fileName)
			return data ?? ts.sys.readFile(fileName)
		}
		compilerHost.writeFile = (fileName: string, data: string) => this.fileHost.writeFile(fileName, data)

		// Iteratively fill out the placeholders with inferred types
		const filenameX = await injectContextTypes(compiledViewPath, compilerHost, compilerOptions, writeSourceFile)

		const typingProgram2 = ts.createProgram([filenameX], compilerOptions, compilerHost /*, templProg*/)
		const typedFile2 = typingProgram2.getSourceFile(filenameX)
		if (!typedFile2)
			throw new Error('fail')

		const diags = ts.getPreEmitDiagnostics(typingProgram2, typedFile2)
		return { source: typedFile2, diagnostics: diags }
	}
}
