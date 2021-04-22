import Dispatcher from "../../utils/dispatcher.js"
import Filter from "../../filters/filter.js"
import LinearFilter from "../../filters/linearFilter.js"

type FilterConstructor = new(query: string) => Filter

export default class FilterView implements View {
	private static filters: Map<string, FilterConstructor> = new Map<string, FilterConstructor>()
	public readonly events: Dispatcher<Events>
	private query: string
	#filter: Filter
	#element: HTMLTextAreaElement

	public constructor(element: HTMLTextAreaElement) {
		this.#element = element
		this.events = new Dispatcher<Events>(["changeQuery"])
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
		this.#filter = null
		this.#element.style.color = null

		let input = this.#element.value

		if(input.startsWith(":")) {
			input = input.substring(1)
			let filterName = input.split(" ", 1)[0]
			this.query = input.substring(filterName.length + 1)

			if(filterName.length == 0 || !FilterView.filters.has(filterName))
				return

			try {
				let FilterConstructor = FilterView.filters.get(filterName)
				this.#filter = new FilterConstructor(this.query)
				this.#element.style.color = "var(--color-primary-variant)"
			} catch(_) {
				this.#element.style.color = "var(--color-accent-variant)"
			}
		} else {
			this.query = input

			if(input.length > 0)
				this.#filter = new LinearFilter(this.query)
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