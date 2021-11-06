import {Text} from "/resources/lib/cobrasu/core.js"
import Filter from "./filter.js"
import Divider from "../divider.js"

export default class LinearFilter implements Filter {
	public readonly description: string = "Search for items with the query contained in them"
	protected query: string

	public constructor(query: string) {
		this.query = Text.simplify(query)
	}

	public match(item: Divider.Item, _: string[]): boolean {
		return Text.simplify(item.title).includes(this.query)
	}
}