import Divider from "../../divider.js"
import Dropdown from "../dropdown.js"

export default class DividerElement extends Divider {
	public readonly element: HTMLElement

	public constructor(id: string) {
		super(id)
		this.element = document.createElement("details")
		this.element.classList.add("divider")

		let summary = document.createElement("summary")
		this.getName().then(name => summary.textContent = name)
		this.element.append(summary)

		summary.addEventListener("contextmenu", e => {
			e.preventDefault()

			Dropdown.show([
				{text: "Compress to", callback: async () => await this.compress()},
				{text: "Open in new tab", callback: async () => await this.open(false)},
				{text: "Rename", callback: async () => {
					let name = prompt(`Enter a new name for the divider "${await this.getName()}"`)

					if(!name)
						return

					let result = await this.setName(name)

					if(!result)
						alert(`Name could not be changed from "${await this.getName()}" to "${name}"`)
				}}
			], {target: (e.target as Element).parentElement})
		})

		this.populate()

		this.events.on("delete", () => this.element.remove())
		this.events.on("rename", details => summary.textContent = details.newName)
		this.events.on("changeContents", async () => await this.populate())
	}

	private async populate(): Promise<void> {
		let {items} = await this.getMainSection()
		let count = items.length

		while(this.element.children.length - 1 < count)
			this.element.append(document.createElement("button"))
		while(this.element.children.length - 1 > count)
			this.element.lastChild.remove()

		for(let i = 1; i < this.element.children.length; i++) {
			let button = this.element.children[i] as HTMLButtonElement

			let index = i - 1
			let item = items[index]
			button.title = item.url
			button.textContent = item.title

			button.onclick = async () => await this.expand([[], index], true, false)
			button.oncontextmenu = async e => {
				e.preventDefault()
				await this.expand([[], index], false, true)
			}
		}
	}
}