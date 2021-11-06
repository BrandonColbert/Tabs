import * as cobrasu from "/resources/lib/cobrasu/core.js"
import Divider from "../../divider.js"
import SectionElement from "./sectionElement.js"

const {Dropdown} = cobrasu.DOM

export default class ItemElement {
	public readonly element: HTMLElement
	private sectionElement: SectionElement
	private bubble: HTMLButtonElement
	private text: HTMLDivElement
	#item: Divider.Item

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

	public get item(): Divider.Item { return this.#item }

	public show(): void {
		this.element.style.display = null
	}

	public hide(): void {
		this.element.style.display = "none"
	}

	public assignItem(route: Divider.Route): void {
		let [path, index] = route
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
				{text: "Move to", callback: () => {
					let divider = this.sectionElement.divider

					async function dive(path: number[]): Promise<void> {
						let mainSection = await divider.getMainSection()
						let section = path.reduce((s, i) => s.sections[i], mainSection)

						let items: cobrasu.DOM.Dropdown.Item[] = []

						if(path.length > 0) {
							let location = path
								.map((_, i) => path
									.slice(0, i)
									.reduce((s, i) => s.sections[i], mainSection)
									.name
								)
								.join(" / ")

							items.push({
								text: `.. (${location})`,
								callback: () => dive(path.slice(0, -1))
							})
						}

						items.push(
							{
								text: section.name,
								callback: async () => {
									let mainSection = await divider.getMainSection()

									let initialSection = route[0].reduce((s, i) => s.sections[i], mainSection)
									let [item] = initialSection.items.splice(route[1], 1)

									let finalSection = path.reduce((s, i) => s.sections[i], mainSection)
									finalSection.items.unshift(item)

									await divider.setMainSection(mainSection)
								}
							},
							...section.sections.map((subsection, index) => ({
								text: `\u279c ${subsection.name}`,
								callback: () => dive([...path, index])
							}))
						)

						Dropdown.show(
							items,
							{position: [`${e.clientX}px`, `${e.clientY}px`]}
						)
					}

					dive(path)
				}},
				{text: "Copy title", callback: () => navigator.clipboard.writeText(this.#item.title)},
				{text: "Copy url", callback: () => navigator.clipboard.writeText(this.#item.url)}
			], {position: [`${e.clientX}px`, `${e.clientY}px`]})
		}
	}
}