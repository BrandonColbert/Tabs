import Filter from "./filter.js"
import {Item} from "../divider.js"
import Text from "../utils/text.js"

export default class UrlFilter implements Filter {
	public readonly description: string = "Matches when the phrase is contained in the url"
	private query: string

	public constructor(query: string) {
		this.query = Text.simplify(query)
	}

	public match(item: Item, _: string[]): boolean {
		return Text.simplify(item.url).includes(this.query)
	}
}