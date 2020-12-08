export interface Coordinates {
	first_line: number
	first_column: number
	last_line: number
	last_column: number
}

export class Location {
	public constructor(public range: readonly [number, number], public coords?: Coordinates) {}
}

export interface Position {
	line: number
	column: number
} 