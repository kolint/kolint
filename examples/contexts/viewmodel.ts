import ko from 'knockout'

interface IThing {
	Label: string;
	Age: number;
	Children: IThingy[];
}

interface IThingy {
	Legs: number;
}

class ForEachVM {
	public readonly things = ko.observableArray<IThing>([
		{
			Label: '1st thing',
			Age: 1,
			Children: [{ Legs: 4 }, { Legs: 8 }]
		},
		{
			Label: '2nd thing',
			Age: 2,
			Children: [{ Legs: 4 }, { Legs: 8 }]
		},
		{
			Label: '3rd thing',
			Age: 3,
			Children: [{ Legs: 4 }, { Legs: 8 }]
		}
	]);
}

// We can also export as namespace thanks to ts.config's interop-settings
export = ForEachVM;