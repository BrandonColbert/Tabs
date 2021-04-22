//@ts-ignore
import {v4 as uuidv4} from "../../resources/scripts/uuid.js"

async function importConfig(): Promise<any> {
	let input = document.createElement("input")
	input.type = "file"

	let text = await new Promise<string | ArrayBuffer>(resolve => {
		let timeout: number = null

		input.onchange = e => {
			if(timeout)
				clearTimeout(timeout)

			let target = e.target as HTMLInputElement
			let [file] = target.files				
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

	return JSON.parse(text.toString())
}

function download(data: string): void {
	let link = document.createElement("a")
	link.href = URL.createObjectURL(new Blob([data], {type: "text/json"}))
	link.download = `Tabs Config.json`
	link.click()
}

export default async function convert() {
	let source = await importConfig()

	let config: any = {
		settings: {
			theme: {
				accent: "firebrick",
				"accent-variant": "crimson",
				background: "#292e3e",
				foreground: "#252b3d",
				"foreground-variant": "#2c3348",
				primary: "darkslateblue",
				"primary-variant": "slateblue",
				text: "#e6dbdb"
			},
			defaultExpandCount: 5,
			expandThreshold: 15,
			expandLimit: 30
		},
		dividers: []
	}

	for(let name of source.dividers) {
		let id: string = uuidv4()
		config.dividers.push(id)

		let section: any = config[`divider#${id}`] = {}
		section.name = name
		section.sections = []
		section.items = source[`dividers.${name}.pages`]
	}

	download(JSON.stringify(config, null, "\t"))
}