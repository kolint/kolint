import * as path from 'path'


// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace utils {
	/**
	 * Utility function to make sure that a uniform representation is used when e.g. comparing paths.
	 * The same path represented in both posix and win32 format should result in the same string.
	 * @param platformDependentPath path specified as win32 or posix path
	 * @returns posix representation of the path.
	 */
	export function canonicalPath(platformDependentPath: string): string {
		return platformDependentPath.split(path.sep).join(path.posix.sep)
	}

	export function isReserved(keyword: string): boolean {
		return ['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import',
			'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'as', 'implements', 'interface', 'let', 'package',
			'private', 'protected', 'public', 'static', 'yield', 'any', 'boolean', 'constructor', 'declare', 'get', 'module', 'require', 'number', 'set', 'string', 'symbol', 'type', 'from', 'of',
			'namespace', 'maybe', 'async', 'await'].includes(keyword)
	}

	export type FlatArray<Arr, Depth extends number> = {
		'done': Arr
		'recur': Arr extends ReadonlyArray<infer InnerArr>
		? FlatArray<InnerArr, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Depth]>
		: Arr
	}[Depth extends -1 ? 'done' : 'recur']

	/* eslint-disable */
	export function flat<A extends any[][], D extends number = 1>(array: A, _depth?: D): FlatArray<A, D>[] {
		const depth = isNaN(_depth as number) ? 1 : Number(_depth)

		if (depth) {
			return (Array.prototype.reduce.call(array, ((acc: any[], cur: any) => {
				if (Array.isArray(cur)) {
					acc.push.apply(acc, flat(cur, depth - 1))
				} else {
					acc.push(cur)
				}

				return acc
			}) as any, [])) as any
		} else {
			return Array.prototype.slice.call(array)
		}
	}
	/* eslint-enable */
}

export default utils
