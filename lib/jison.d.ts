declare module 'jison' {
	export interface GrammarConfig {
		lex: { rules: (string | string[])[][] }
		bnf: { tag: string[] }
	}

	export class Parser<T, U> {
		public constructor(grammar: GrammarConfig | string, options?: { debug?: boolean, type?: 'lr0' | 'slr' | 'll' | 'lr' })

		public yy: T
		public trace: () => void
		public parse(input: string): U
		public generate(): string
	}
}