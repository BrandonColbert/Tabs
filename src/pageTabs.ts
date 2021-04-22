import Divider from "./divider.js"
import Tabs from "./tabs.js"

async function setup() {
	let items = await new Promise<{[key: string]: any}>(r => chrome.storage.local.get(items => r(items)))

	//Use default configuration if none exists
	if(items.constructor == Object && Object.keys(items).length == 0) {
		items = await Tabs.getDefaultConfig()
		await new Promise<void>(r => chrome.storage.local.set(items, () => r()))
	}

	//Add compress option to context menu
	chrome.contextMenus.create({
		title: "Compress",
		contexts: ["page", "frame", "selection", "page_action"],
		onclick: async (_, tab) => {
			//Get all the tabs in the window
			let tabs = await new Promise<chrome.tabs.Tab[]>(r => chrome.tabs.query(
				{windowId: chrome.windows.WINDOW_ID_CURRENT},
				tabs => r(tabs))
			)

			//Find the closest divider left of the current tab
			let dividerTab = tabs
				.slice(0, tab.index)
				.reverse()
				.find(t => t.url.startsWith(`chrome-extension://${chrome.runtime.id}/html/divider`))

			if(!dividerTab)
				return

			//Compress to it
			let url = dividerTab.url
			let id = decodeURIComponent(url.substring(url.indexOf('#') + 1))

			let divider = await Divider.load(id)
			await divider.compress(tab.id)
		}
	})
}

setup()