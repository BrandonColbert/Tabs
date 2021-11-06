import {Text} from "/resources/lib/cobrasu/core.js"
import Filter from "./filter.js"
import Divider from "../divider.js"

export default class UrlFilter implements Filter {
	public readonly description: string = "Matches when the phrase is contained in the url"
	private query: string

	public constructor(query: string) {
		this.query = Text.simplify(query)
	}

	public match(item: Divider.Item, _: string[]): boolean {
		return Text.simplify(item.url).includes(this.query)
	}
}