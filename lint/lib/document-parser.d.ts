import { YY } from '../src/parser/document-builder'

export interface GrammarConfig {
	lex: { rules: (string | string[])[][] }
	bnf: { tag: string[] }
}

export class Parser<U> {
	public constructor()

	public yy: YY
	public lexer: { options: { ranges: boolean } }
	public trace: () => void
	public parse(input: string): U
	public generate(): string
}