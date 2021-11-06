import Tabs from "./tabs.js"

Tabs.applyTheme()

async function bindOption(element: HTMLInputElement, category: string, key: string[]) {
	element.value = key.reduce<any>((v, k) => v[k], await Tabs.getSettings()).toString()

	element.addEventListener("input", async e => {
		let target = e.target as HTMLInputElement
		let value = null

		switch(category) {
			case "string":
				value = target.value
				break
			case "number":
				value = target.valueAsNumber
				break
		}

		let settings = await Tabs.getSettings()
		key.slice(0, -1).reduce<any>((v, k) => v[k], settings)[key[key.length - 1]] = value
		await Tabs.setSettings(settings)
	})
}

bindOption(document.querySelector(".options #primary"),
	"string",
	["theme", "primary"]
)

bindOption(document.querySelector(".options #primary-variant"),
	"string",
	["theme", "primary-variant"]
)

bindOption(document.querySelector(".options #accent"),
	"string",
	["theme", "accent"]
)

bindOption(document.querySelector(".options #accent-variant"),
	"string",
	["theme", "accent-variant"]
)

bindOption(document.querySelector(".options #background"),
	"string",
	["theme", "background"]
)

bindOption(document.querySelector(".options #foreground"),
	"string",
	["theme", "foreground"]
)

bindOption(document.querySelector(".options #foreground-variant"),
	"string",
	["theme", "foreground-variant"]
)

bindOption(document.querySelector(".options #text"),
	"string",
	["theme", "text"]
)

bindOption(document.querySelector(".options #default-expand-count"),
	"number",
	["defaultExpandCount"]
)

bindOption(document.querySelector(".options #expand-threshold"),
	"number",
	["expandThreshold"]
)

bindOption(document.querySelector(".options #expand-limit"),
	"number",
	["expandLimit"]
)

;(document.querySelector("#reload") as HTMLButtonElement).addEventListener(
	"click",
	async () => await Tabs.reloadCustomPages()
)

;(document.querySelector("#import-config") as HTMLButtonElement).addEventListener(
	"click",
	async () => {
		if(await Tabs.importConfig())
			await Tabs.reloadCustomPages()
	}
)

;(document.querySelector("#export-config") as HTMLButtonElement).addEventListener(
	"click",
	async () => await Tabs.exportConfig()
)

;(document.querySelector("#reset-settings") as HTMLButtonElement).addEventListener(
	"click",
	async () => {
		let defaultConfig = await Tabs.getDefaultConfig()
		await Tabs.setSettings(defaultConfig.settings)
		await Tabs.reloadCustomPages()
	}
)