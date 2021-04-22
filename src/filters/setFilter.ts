import Filter from "./filter.js"
import {Item} from "../divider.js"
import simplifyString from "../utils/simplifyString.js"

export default class SetFilter implements Filter {
	public readonly description: string = "Matches when all of the space separated terms are found in the title"
	private terms: string[]

	public constructor(query: string) {
		this.terms = simplifyString(query).split(" ")
	}

	public match(item: Item, _: string[]): boolean {
		let title = simplifyString(item.title)

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
