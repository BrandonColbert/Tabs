import {Text} from "/resources/lib/cobrasu/core.js"
import Filter from "./filter.js"
import Divider from "../divider.js"

export default class SetFilter implements Filter {
	public readonly description: string = "Matches when all of the space separated terms are found in the title"
	private terms: string[]

	public constructor(query: string) {
		this.terms = Text.simplify(query).split(" ")
	}

	public match(item: Divider.Item, _: string[]): boolean {
		let title = Text.simplify(item.title)

		for(let term of this.terms) {
			if(term.startsWith("-")) {
				term = term.substring(1)

				if(term && title.includes(term))
					return false
			} else if(!title.includes(term))
				return false
		}

		return true
	}
}