import { Position } from './parser/location'
import * as path from 'path'

export const workspace = path.resolve(__dirname, '..')

export function getPosFromIndex(data: string, index: number): Position {
	const lines = data.split('\n')

	let length = 0
	for (let currentLine = 0; currentLine < lines.length; currentLine++) {
		// Add the newline char removed in split
		const currentLineLength = lines[currentLine].length + 1

		if (length + currentLineLength > index) {
			const line = currentLine
			const column = index - length
			return { line, column }
		} else {
			length += currentLineLength
		}
	}
	throw new Error('Error converting offset to location. Index out of bounds.')
}
