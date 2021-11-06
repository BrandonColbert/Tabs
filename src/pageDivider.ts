import Tabs from "./tabs.js"
import Divider from "./divider.js"
import DividerView from "./ui/views/dividerView.js"
import SetFilter from "./filters/setFilter.js"
import NotFilter from "./filters/notFilter.js"
import UrlFilter from "./filters/urlFilter.js"
import RegexFilter from "./filters/regexFilter.js"
import FilterView from "./ui/views/filterView.js"
import LinearFilter from "./filters/linearFilter.js"

Tabs.applyTheme()

let view: DividerView = null

async function setup(): Promise<void> {
	view?.destroy()
	view = null

	let url = window.location.href
	let splitIndex = url.indexOf('#')

	if(splitIndex == -1)
		return

	let id = decodeURIComponent(url.substring(splitIndex + 1))

	if((await Divider.all()).indexOf(id) == -1) {
		document.title = "Divider Not Found"
		return
	}

	view = new DividerView(id, document.querySelector("body"))
	view.events.once("delete", async details => {
		let ids = await Divider.all()

		//Navigate to the next divider or close if none left
		if(ids.length == 0)
			window.close()
		else
			location.hash = ids[Math.min(details.index, ids.length - 1)]
	})
}

FilterView.addFilter("set", SetFilter)
FilterView.addFilter("not", NotFilter)
FilterView.addFilter("url", UrlFilter)
FilterView.addFilter("regex", RegexFilter)
FilterView.addFilter("linear", LinearFilter)

setup()
window.addEventListener("hashchange", () => setup())