import Filter from "./filter.js"
import {Item} from "../divider.js"
import Text from "../utils/text.js"

export default class LinearFilter implements Filter {
	public readonly description: string = "Search for items with the query contained in them"
	protected query: string

	public constructor(query: string) {
		this.query = Text.simplify(query)
	}

	public match(item: Item, _: string[]): boolean {
		return Text.simplify(item.title).includes(this.query)
	}
}