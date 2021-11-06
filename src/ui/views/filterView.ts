import {Dispatcher} from "/resources/lib/cobrasu/core.js"
import Filter from "../../filters/filter.js"
import LinearFilter from "../../filters/linearFilter.js"
import StandardFilter from "../../filters/standardFilter.js"

type FilterConstructor = new(query: string) => Filter

export default class FilterView implements View {
	private static filters: Map<string, FilterConstructor> = new Map<string, FilterConstructor>()
	public readonly events: Dispatcher<Events>
	private query: string
	#filter: Filter
	#element: HTMLTextAreaElement

	public constructor(element: HTMLTextAreaElement) {
		this.#element = element
		this.events = new Dispatcher<Events>("changeQuery")
		this.refresh()

		element.onkeydown = e => {
			switch(e.key) {
				case "Enter":
					e.preventDefault()
					break
			}
		}

		element.oninput = async e => {
			this.refresh()
			this.events.fire("changeQuery")
		}
	}

	public get element(): HTMLElement { return this.#element }
	public get filter(): Filter { return this.#filter }

	public destroy(): void {
		this.#element.onkeydown = null
		this.#element.oninput = null
	}

	private refresh(): void {
		let input = this.#element.value
		let Constructor: FilterConstructor

		if(input.startsWith(":")) {
			input = input.substring(1)
			let filterName = input.split(" ", 1)[0]
			this.query = input.substring(filterName.length + 1)

			if(filterName.length == 0 || !FilterView.filters.has(filterName))
				return

			Constructor = FilterView.filters.get(filterName)		
			this.#element.style.color = "var(--color-primary-variant)"	
		} else {
			this.query = input

			Constructor = input.length > 0 ? StandardFilter : null
			this.#element.style.color = null
		}

		try {
			this.#filter = Constructor ? new Constructor(this.query) : null
		} catch(_) {
			this.#filter = null
			this.#element.style.color = "var(--color-accent-variant)"
		}

		this.element.title = this.#filter?.description ?? ""
	}

	/**
	 * Registers a filter(s) to be used when processing queries
	 * @param filters Filter to add
	 */
	public static addFilter<T extends FilterConstructor>(name: string, filter: T): void {
		FilterView.filters.set(name, filter)
	}
}

interface Events {
	changeQuery: void
}