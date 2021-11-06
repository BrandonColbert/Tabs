import {Text} from "/resources/lib/cobrasu/core.js"
import Filter from "./filter.js"
import Divider from "../divider.js"

export class StandardFilter implements Filter {
	public readonly description: string =
`Matches when all of the space separated terms are found in the title.

Surrounding a term with double quotes allows the term include spaces.

A term beginning and ending with '/' will be used as regex against the title.

Any term may be prefixed with '-' to ensure it is not present in title.`
	protected terms: StandardFilter.Term[]

	public constructor(query: string) {
		let regex = /(?<=^|\s)\-?(([\w\d]+)|("(\\.|[^\"])+")|(\/(\\.|[^\/])+\/))(?=\s|$)/g

		this.terms = []

		for(let match of query.matchAll(regex)) {
			let term: StandardFilter.Term = {
				type: null,
				value: null,
				include: true
			}

			let [text] = match

			if(text.startsWith("-")) { //Detect terms to exclude
				text = text.slice(1)
				term.include = false
			}

			switch(true) {
				case /^[\w\d]+$/g.test(text): //Normal term
					term.value = Text.simplify(text)
					term.type = "text"
					break
				case /^"(\\.|[^\"])+"$/g.test(text): //Term with spaces
				case /^\/(\\.|[^\/])+\/$/g.test(text): //Regex term
					term.value = new RegExp(text.slice(1, -1), "i")
					term.type = "regex"
					break
				default:
					throw new Error(`Term '${text}' is invalid`)
			}

			this.terms.push(term)
		}
	}

	public match(item: Divider.Item, _: string[]): boolean {
		let content = Text.simplify(item.title)

		for(let term of this.terms) {
			let conforms: boolean

			switch(term.type) {
				case "text":
					conforms = content.includes(term.value as string)
					break
				case "regex":
					conforms = (term.value as RegExp).test(content)
					break
				default:
					conforms = false
					break
			}

			if(term.include && !conforms)
				return false
			else if(!term.include && conforms)
				return false
		}

		return true
	}
}

export namespace StandardFilter {
	export interface Term {
		type: "text" | "regex"
		value: string | RegExp
		include: boolean
	}
}

export default StandardFilter