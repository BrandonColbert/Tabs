import {Item, Route} from "../../divider.js"
import Dropdown from "../dropdown.js"
import SectionElement from "./sectionElement.js"

export default class ItemElement {
	public readonly element: HTMLElement
	private sectionElement: SectionElement
	private bubble: HTMLButtonElement
	private text: HTMLDivElement
	#item: Item

	public constructor(sectionElement: SectionElement) {
		this.sectionElement = sectionElement

		this.element = document.createElement("div")
		this.element.classList.add("item")

		this.bubble = document.createElement("button")
		this.bubble.classList.add("bubble")
		this.element.append(this.bubble)

		this.text = document.createElement("div")
		this.element.append(this.text)
	}

	public get item(): Item { return this.#item }

	public show(): void {
		this.element.style.display = null
	}

	public hide(): void {
		this.element.style.display = "none"
	}

	public assignItem(route: Route): void {
		let [, index] = route
		this.#item = this.sectionElement.section.items[index]

		this.text.textContent = this.#item.title
		this.text.title = this.#item.title
		this.bubble.title = this.#item.url

		this.bubble.onclick = async e => {
			e.preventDefault()
			await this.sectionElement.divider.expand(route, false, false)
		}

		this.bubble.oncontextmenu = async e => {
			e.preventDefault()
			await this.sectionElement.divider.expand(route, false, true)
		}

		this.text.oncontextmenu = e => {
			e.preventDefault()

			Dropdown.show([
				{text: "Copy title", callback: () => navigator.clipboard.writeText(this.#item.title)},
				{text: "Copy url", callback: () => navigator.clipboard.writeText(this.#item.url)}
			], {position: [`${e.clientX}px`, `${e.clientY}px`]})
		}
	}
}