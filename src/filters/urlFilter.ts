import Filter from "./filter.js"
import {Item} from "../divider.js"
import simplifyString from "../utils/simplifyString.js"

export default class UrlFilter implements Filter {
	public readonly description: string = "Matches when the phrase is contained in the url"
	private query: string

	public constructor(query: string) {
		this.query = simplifyString(query)
	}

	public match(item: Item, _: string[]): boolean {
		return simplifyString(item.url).includes(this.query)
	}
}
