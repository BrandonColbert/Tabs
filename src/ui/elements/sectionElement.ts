import DDListElement from "../ddListElement.js"
import Divider, {Section} from "../../divider.js"
import ItemElement from "./itemElement.js"
import Filter from "../../filters/filter.js"
import Dropdown from "../dropdown.js"

export default class SectionElement {
	public readonly divider: Divider
	public readonly element: HTMLElement
	private parentElement: SectionElement

	//Section management
	private sectionContainer: DDListElement
	private sectionElements: SectionElement[] = []

	//Item management
	private itemContainer: DDListElement
	private itemElements: ItemElement[] = []

	#section: Section

	public constructor(divider: Divider, element: HTMLElement)
	public constructor(parentElement: SectionElement)
	public constructor(par1: any, par2?: any) {
		switch(true) {
			case par1 instanceof Divider:
				let divider = par1 as Divider
				let element = par2 as HTMLElement

				this.divider = divider
				this.element = element
				break
			case par1 instanceof SectionElement:
				let parentElement = par1 as SectionElement

				this.divider = parentElement.divider
				this.parentElement = parentElement
				this.element = document.createElement("details")
				this.element.classList.add("section")
				this.element.append(document.createElement("summary"))
				break
		}
	}

	public get section(): Section { return this.#section }

	public showAll(): void {
		for(let sectionElement of this.sectionElements)
			sectionElement.showAll()

		for(let itemElement of this.itemElements)
			itemElement.show()
	}

	public hideAll(): void {
		for(let sectionElement of this.sectionElements)
			sectionElement.hideAll()

		for(let itemElement of this.itemElements)
			itemElement.hide()
	}

	public filterContents(filter: Filter): void {
		if(!filter) {
			this.showAll()
			return
		}

		for(let sectionElement of this.sectionElements)
			sectionElement.filterContents(filter)

		let pathNames: string[] = []

		let next: SectionElement = this
		while(next.parentElement) {
			pathNames.push(next.section.name)
			next = next.parentElement
		}

		for(let itemElement of this.itemElements) {
			if(filter.match(itemElement.item, pathNames))
				itemElement.show()
			else
				itemElement.hide()
		}
	}

	public async assignSection(path: number[]): Promise<void> {
		this.#section = path.reduce((s, i) => s.sections[i], await this.divider.getMainSection())

		if(this.parentElement) {
			let summary = this.element.querySelector("summary")
			summary.textContent = this.#section.name

			summary.oncontextmenu = e => {
				e.preventDefault()

				Dropdown.show([
					{text: "Add subsection", callback: async () => {
						;(this.element as HTMLDetailsElement).open = true

						let mainSection = await this.divider.getMainSection()
						let section = path.reduce((s, i) => s.sections[i], mainSection)
						section.sections.push({
							name: "New Section",
							sections: [],
							items: []
						})

						await this.divider.setMainSection(mainSection)
					}},
					{text: "Rename", callback: async () => {
						let name = prompt(`Enter a new name for the section "${this.#section.name}"`)
	
						if(!name)
							return
	
						let mainSection = await this.divider.getMainSection()
						let section = path.reduce((s, i) => s.sections[i], mainSection)

						if(name == section.name)
							return

						section.name = name
						await this.divider.setMainSection(mainSection)
					}},
					{text: "Delete", callback: async () => {
						let mainSection = await this.divider.getMainSection()
						let section = path.slice(0, -1).reduce((s, i) => s.sections[i], mainSection)
						section.sections.splice(path[path.length - 1], 1)

						await this.divider.setMainSection(mainSection)
					}}
				], {position: [`${e.clientX}px`, `${e.clientY}px`]})
			}
		}

		await this.populateSections(path)
		this.populateItems(path)
	}

	private async populateSections(path: number[]): Promise<void> {
		let container = this.sectionContainer

		if(!container) {
			container = document.createElement("dd-list") as DDListElement
			this.sectionContainer = container

			container.classList.add("sections")
			this.element.append(container)
		}

		while(this.sectionElements.length > this.#section.sections.length)
			this.sectionElements.pop().element.remove()

		while(this.sectionElements.length < this.#section.sections.length) {
			let se = new SectionElement(this)
			this.sectionElements.push(se)

			container.append(se.element)
		}

		let children = [...container.children]
		await Promise.all(
			this.sectionElements
				.map(se => se.assignSection([...path, children.indexOf(se.element)]))
		)

		container.events.forgetAll()
		container.dataBind = index => ({
			type: "section",
			path: [...path, index],
			value: this.#section.sections[index]
		})

		container.events.on("reorder", async e => {
			let mainSection = await this.divider.getMainSection()
			let section = path.reduce((s, i) => s.sections[i], mainSection)

			let item = section.sections[e.from]
			section.sections.splice(e.from, 1)
			section.sections.splice(e.to, 0, item)

			await this.divider.setMainSection(mainSection)
		})

		container.events.on("drop", async e => {
			let mainSection = await this.divider.getMainSection()
			let section = path.reduce((s, i) => s.sections[i], mainSection)
			section = section.sections[e.index]

			switch(e.data.type) {
				case "section":
					let dropSectionPath = e.data.path as number[]

					if(path.length >= dropSectionPath.length && dropSectionPath.every((v, i) => v == path[i])) {
						e.cancel()
						return
					}

					section.sections.push(e.data.value)
					break
				case "item":
					section.items.unshift(e.data.value)
					break
			}

			await this.divider.setMainSection(mainSection)
		})

		container.events.on("transfer", async e => {
			let mainSection = await this.divider.getMainSection()
			let section = path.reduce((s, i) => s.sections[i], mainSection)
			section.sections.splice(e.index, 1)
			await this.divider.setMainSection(mainSection)
		})
	}

	private populateItems(path: number[]): void {
		let container = this.itemContainer

		if(!container) {
			container = document.createElement("dd-list") as DDListElement
			this.itemContainer = container

			container.classList.add("items")
			this.element.append(container)
		}

		while(this.itemElements.length > this.#section.items.length)
			this.itemElements.pop().element.remove()

		while(this.itemElements.length < this.#section.items.length) {
			let ie = new ItemElement(this)
			this.itemElements.push(ie)

			container.append(ie.element)
		}

		let children = [...container.children]
		for(let itemElement of this.itemElements)
			itemElement.assignItem([path, children.indexOf(itemElement.element)])

		container.events.forgetAll()
		container.dataBind = index => ({
			type: "item",
			route: [path, index],
			value: this.#section.items[index]
		})

		container.events.on("reorder", async e => {
			let mainSection = await this.divider.getMainSection()
			let section = path.reduce((s, i) => s.sections[i], mainSection)

			let item = section.items[e.from]
			section.items.splice(e.from, 1)
			section.items.splice(e.to, 0, item)

			await this.divider.setMainSection(mainSection)
		})

		container.events.on("drop", async e => {
			let mainSection = await this.divider.getMainSection()
			let section = path.reduce((s, i) => s.sections[i], mainSection)

			switch(e.data.type) {
				case "section":
					let dropSectionPath = e.data.path as number[]

					if(path.length >= dropSectionPath.length && dropSectionPath.every((v, i) => v == path[i])) {
						e.cancel()
						return
					}

					section.sections.push(e.data.value)
					break
				case "item":
					section.items.splice(e.index, 0, e.data.value)
					break
			}

			await this.divider.setMainSection(mainSection)
		})

		container.events.on("transfer", async e => {
			let mainSection = await this.divider.getMainSection()
			let section = path.reduce((s, i) => s.sections[i], mainSection)
			section.items.splice(e.index, 1)
			await this.divider.setMainSection(mainSection)
		})
	}
}