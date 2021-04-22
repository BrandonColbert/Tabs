import Filter from "./filter.js"
import {Item} from "../divider.js"
import simplifyString from "../utils/simplifyString.js"

export default class RegexFilter implements Filter {
	public readonly description: string = "Matches when regex is applicable to the title"
	private regex: RegExp

	public constructor(query: string) {
		this.regex = new RegExp(query)
	}

	public match(item: Item, _: string[]): boolean {
		return this.regex.test(simplifyString(item.title))
	}
}
