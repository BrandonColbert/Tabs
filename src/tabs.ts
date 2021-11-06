export default class Tabs {
	public static async reloadCustomPages(): Promise<void> {
		let dividerTabs = await new Promise<chrome.tabs.Tab[]>(r => chrome.tabs.query(
			{"url": `chrome-extension://${chrome.runtime.id}/*`},
			tabs => r(tabs)
		))

		for(let tab of dividerTabs)
			chrome.tabs.reload(tab.id)
	}

	public static async getDefaultConfig(): Promise<any> {
		let response = await fetch(chrome.runtime.getURL("resources/data/config.json"))
		let data = await response.json()

		return data
	}

	public static async importConfig(): Promise<boolean> {
		let input = document.createElement("input")
		input.type = "file"

		let text = await new Promise<string | ArrayBuffer>(resolve => {
			let timeout: number = null

			input.onchange = e => {
				if(timeout)
					clearTimeout(timeout)

				let target = e.target as HTMLInputElement
				let [file] = Array.from(target.files)
				target.remove()

				let reader = new FileReader()
				reader.onload = e => resolve(e.target.result)
				reader.readAsText(file)
			}

			window.addEventListener(
				"focusin",
				() => timeout = setTimeout(() => resolve(null), 200),
				{once: true}
			)

			input.click()
		})

		if(!text)
			return false

		let config = JSON.parse(text.toString())
		await new Promise<void>(r => chrome.storage.local.clear(() => r()))
		await new Promise<void>(r => chrome.storage.local.set(config, () => r()))

		return true
	}

	public static async exportConfig(): Promise<void> {
		let config = await new Promise(r => chrome.storage.local.get(null, config => r(config)))
		let data = JSON.stringify(config, null, "\t")
		let date = new Date()

		let link = document.createElement("a")
		link.href = URL.createObjectURL(new Blob([data], {type: "text/json"}))
		link.download = `Tabs Config ${date.getFullYear()}-${1 + date.getMonth()}-${date.getDate()}.json`
		link.click()
	}

	public static async getSettings(): Promise<Settings> {
		let result = await new Promise<{[key: string]: any}>(r => chrome.storage.local.get(
			"settings",
			result => r(result)
		))

		return result?.settings ?? {}
	}

	public static async setSettings(value: Settings): Promise<void> {
		await new Promise<void>(r => chrome.storage.local.set({settings: value}, () => r()))
	}

	/**
	 * Applies the configured theme to the current document
	 */
	public static async applyTheme(): Promise<void> {
		//Get theme from settings
		let settings = await Tabs.getSettings()
		let theme = settings?.theme

		//Do nothing if no theme present
		if(!theme)
			return

		let style = document.documentElement.style

		//Modify CSS custom colors according to theme values
		for(let [key, value] of Object.entries(theme))
			style.setProperty(`--color-${key}`, value)
	}
}

interface Settings {
	theme: Theme
	defaultExpandCount: number
	expandLimit: number
	expandThreshold: number
}

interface Theme {
	accent: string
	"accent-variant": string
	background: string
	foreground: string
	"foreground-variant": string
	primary: string
	"primary-variant": string
	text: string
}