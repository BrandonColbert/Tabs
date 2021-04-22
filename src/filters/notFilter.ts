import {Item} from "src/divider.js"
import LinearFilter from "./linearFilter.js"

export default class NotFilter extends LinearFilter {
	public readonly description: string = "Matches when the phrase is not contained in the title"

	public constructor(query: string) {
		super(query)
	}

	public match(item: Item, path: string[]): boolean {
		return !super.match(item, path)
	}
}