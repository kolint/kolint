import * as path from 'path'

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
