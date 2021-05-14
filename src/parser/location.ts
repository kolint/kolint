export interface Coordinates {
	first_line: number
	first_column: number
	last_line: number
	last_column: number
}

export interface Location extends Coordinates {
	range: [number, number]
}

export interface Position {
	line: number
	column: number
}