import Filter from "./filter.js"
import {Item} from "src/divider.js"
import simplifyString from "../utils/simplifyString.js"

export default class LinearFilter implements Filter {
	public readonly description: string = "Search for items with the query contained in them"
	protected query: string

	public constructor(query: string) {
		this.query = simplifyString(query)
	}

	public match(item: Item, _: string[]): boolean {
		return simplifyString(item.title).includes(this.query)
	}
}