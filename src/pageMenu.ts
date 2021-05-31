import Divider from "./divider.js"
import Tabs from "./tabs.js"
import DDListElement from "./ui/ddListElement.js"
import DividerElement from "./ui/elements/dividerElement.js"
import Text from "./utils/text.js"

Tabs.applyTheme()
DDListElement.define()

async function setup(): Promise<void> {
	let dividers = document.querySelector("#dividers") as DDListElement

	dividers.events.on("reorder", async e => {
		let ids = await Divider.all()
		let id = ids[e.from]

		ids.splice(e.from, 1)
		ids.splice(e.to, 0, id)

		await new Promise<void>(r => chrome.storage.local.set({dividers: ids}, () => r()))
	})

	for(let id of await Divider.all()) {
		let dividerElement = new DividerElement(id)
		dividers.append(dividerElement.element)
	}

	;(document.querySelector("#create") as HTMLElement).onclick = async () => {
		let divider = await Divider.create()
		let dividerElement = new DividerElement(divider.id)
		dividers.append(dividerElement.element)

		dividerElement.element.scrollIntoView({behavior: "smooth", block: "end"})
	}

	;(document.querySelector("#jump") as HTMLElement).onclick = async () => {
		let query = prompt("Enter the name of the divder to open.")

		if(!query)
			return

		let ids = await Divider.all()
		let dividers = await Promise.all(ids.map(id => Divider.load(id)))
		let names = await Promise.all(dividers.map(d => d.getName()))

		do {
			let q = Text.simplify(query)

			for(let n of names) {
				if(!Text.simplify(n).startsWith(q))
					continue

				dividers[names.indexOf(n)].open(true)
				return
			}

			query = prompt("Unable to find divider, enter divider name.", query)
		} while(query)
	}
}

setup()