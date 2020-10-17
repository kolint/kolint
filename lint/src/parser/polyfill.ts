/* eslint-disable */

declare global {
	type FlatArray<Arr, Depth extends number> = {
		'done': Arr,
		'recur': Arr extends ReadonlyArray<infer InnerArr>
		? FlatArray<InnerArr, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Depth]>
		: Arr
	}[Depth extends -1 ? 'done' : 'recur']

	interface Array<T> {
		/**
		* Returns a new array with all sub-array elements concatenated into it recursively up to the
		* specified depth.
		*
		* @param depth The maximum recursion depth
		*/
		flat<A extends any[][], D extends number = 1>(
			this: A,
			depth?: D
		): FlatArray<A, D>[]
	}
}

Object.defineProperty(Array.prototype, 'flat', {
	configurable: true,
	value: function flat<A extends any[][], D extends number = 1>(
		this: A,
		_depth?: D
	): FlatArray<A, D>[] {
		const depth = isNaN(_depth as number) ? 1 : Number(_depth)

		if (depth) {
			return (Array.prototype.reduce.call(this, ((acc: any[], cur: any) => {
				if (Array.isArray(cur)) {
					acc.push.apply(acc, flat.call(cur, depth - 1))
				} else {
					acc.push(cur)
				}

				return acc
			}) as any, [])) as any
		} else {
			return Array.prototype.slice.call(this)
		}
	},
	writable: true
})

export {}