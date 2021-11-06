import {Text} from "/resources/lib/cobrasu/core.js"
import Filter from "./filter.js"
import Divider from "../divider.js"

export default class RegexFilter implements Filter {
	public readonly description: string = "Matches when regex is applicable to the title"
	private regex: RegExp

	public constructor(query: string) {
		this.regex = new RegExp(query)
	}

	public match(item: Divider.Item, _: string[]): boolean {
		return this.regex.test(Text.simplify(item.title))
	}
}