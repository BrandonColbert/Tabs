import Divider, {Section} from "../../divider.js"
import Dropdown from "../dropdown.js"
import FilterView from "./filterView.js"
import Tabs from "../../tabs.js"
import SectionElement from "../elements/sectionElement.js"

export default class DividerView extends Divider implements View {
	public readonly element: HTMLElement
	private filterView: FilterView
	private sectionElement: SectionElement

	/**
	 * @param name Name of the divider to display
	 * @param element Root element to display information with
	 */
	public constructor(id: string, element: HTMLElement) {
		super(id)
		this.element = element
		this.filterView = new FilterView(element.querySelector("#filter"))
		this.sectionElement = new SectionElement(this, this.element.querySelector("#contents"))
		this.setup()
	}

	private async setup(): Promise<void> {
		;(this.element.querySelector("#compress-left") as HTMLElement).onclick = () => this.compressLeft()
		;(this.element.querySelector("#compress-right") as HTMLElement).onclick = () => this.compressRight()
		;(this.element.querySelector("#expand-right") as HTMLElement).onclick = () => this.expandRight()
		;(this.element.querySelector("#options") as HTMLElement).onclick = e => Dropdown.show([
			{text: "Rename", callback: async () => {
				let name = prompt(`Enter a new name for the divider "${await this.getName()}"`)

				if(!name)
					return

				let result = await this.setName(name)

				if(!result)
					alert(`Name could not be changed from "${await this.getName()}" to "${name}"`)
			}},
			{text: "Add subsection", callback: async () => {
				let mainSection = await this.getMainSection()
				mainSection.sections.push({
					name: "New Section",
					sections: [],
					items: []
				})

				await this.setMainSection(mainSection)
			}},
			{text: "Save as text", callback: async () => {
				function stringify(section: Section): string {
					let text = `${section.name}:\n`

					for(let s of section.sections) {
						if(s.sections.length == 0 && s.items.length == 0)
							continue

						for(let line of stringify(s).split("\n"))
							text += `\t${line}\n`
					}

					for(let item of section.items)
						text += `\t${item.title} <${item.url}>\n`

					return text.trim()
				}

				let text = stringify(await this.getMainSection())

				//Download the text file
				let link = document.createElement("a")
				link.href = URL.createObjectURL(new Blob([text], {type: "text"}))
				link.download = `${await this.getName()}.txt`
				link.click()
			}},
			{text: "Duplicate divider", callback: async () => {
				let divider = await this.duplicate()
				location.hash = divider.id
			}},
			{text: "Create bookmark folder", callback: async () => {
				type Node = chrome.bookmarks.BookmarkTreeNode

				async function mark(section: Section, parentId: string = null): Promise<Node> {
					let folder = await new Promise<Node>(r => {
						chrome.bookmarks.create({
							title: section.name,
							parentId: parentId
						}, result => r(result))
					})

					await Promise.all(section.sections.map(s => mark(s, folder.id)))
					await Promise.all(section.items.map(i => new Promise<void>(r => {
						chrome.bookmarks.create({
							parentId: folder.id,
							title: i.title,
							url: i.url
						}, () => r())
					})))

					return folder
				}

				let folder = await mark(await this.getMainSection())

				await new Promise<void>(r => chrome.tabs.update({
					url: `chrome://bookmarks/?id=${folder.id}`
				}, () => r()))
			}},
			{text: "Delete divider", callback: async () => {
				if(!confirm(`Are you sure you want to delete '${await this.getName()}'`))
					return

				await this.delete()
			}}
		], {target: e.target as Element})

		let nameElement = this.element.querySelector("#name") as HTMLElement
		nameElement.onclick = async e => {
			let ids = await Divider.all()
			let dividers = await Promise.all(ids.map(id => Divider.load(id)))

			//Show dividers that can be opened and scroll to the one that is opened
			Dropdown.show(
				await Promise.all(dividers.map(async d => ({
					text: await d.getName(),
					callback: () => location.hash = d.id
				}))),
				{
					height: "50%",
					target: e.target as Element
				}
			).element.children[await this.getIndex()]?.scrollIntoView({block: "center"})
		}

		await this.sectionElement.assignSection([])
		this.events.on(
			"changeContents",
			async () => await this.sectionElement.assignSection([])
		)

		function updateName(name: string): void {
			document.title = `${name} (Divider)`
			nameElement.textContent = name
		}

		updateName(await this.getName())
		this.events.on(
			"rename",
			details => updateName(details.newName)
		)

		this.sectionElement.filterContents(this.filterView.filter)
		this.filterView.events.on(
			"changeQuery",
			() => this.sectionElement.filterContents(this.filterView.filter)
		)
	}

	public destroy(): void {
		this.filterView.destroy()
		this.sectionElement.element.innerHTML = ""
		this.events.forgetAll()
	}

	public async compressLeft(): Promise<void> {
		await this.compress((currentTab, tab) => tab.index < currentTab.index)
	}

	public async compressRight(): Promise<void> {
		await this.compress((currentTab, tab) => tab.index > currentTab.index)
	}

	public async expandRight(): Promise<void> {
		let settings = await Tabs.getSettings()
		let section = await this.getMainSection()
		let itemCount = section.items.length

		let count = Math.min(itemCount, settings.defaultExpandCount)

		do {
			let response = prompt(
				`Open how many tabs out of ${itemCount}`,
				count.toString()
			)

			if(response == null)
				return

			count = parseInt(response)
		} while(isNaN(count))

		if(count > settings.expandLimit) {
			alert(`${count} tabs cannot be opened since the limit is ${settings.expandLimit}.\n\nThis number can be modified in settings to open more tabs at once.`)
			return
		}

		if(settings.expandThreshold > 0 && count > settings.expandThreshold && !confirm(`Are you sure you want to open ${count} new tabs?`))
			return

		for(let i = 0; i < count; i++)
			await this.expand([[], 0], false, true)
	}
}