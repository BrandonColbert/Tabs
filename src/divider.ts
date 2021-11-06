import GlobalDispatcher from "./utils/globalDispatcher.js"
type Tab = chrome.tabs.Tab

//@ts-ignore
import {v4 as uuidv4} from "/resources/scripts/uuid.js"
type uuidv4 = () => string

/**
 * Stores information about tabs
 */
export class Divider {
	public readonly id: string
	public readonly events: GlobalDispatcher<Events>

	protected constructor(id: string) {
		this.id = id
		this.events = new GlobalDispatcher<Events>(this.storageKey, "changeContents", "delete", "rename", "reorder")
	}

	private get storageKey() { return `divider#${this.id}` }

	/**
	 * @returns The index of the divider relative to others
	 */
	public async getIndex(): Promise<number> {
		let ids = await Divider.all()
		return ids.indexOf(this.id)
	}

	/**
	 * Set the index of the divider, indicating its order
	 * @param value New index value
	 */
	public async setIndex(value: number): Promise<void> {
		let index = await this.getIndex()

		//Create new ordering and update
		let ids = await Divider.all()
		ids.splice(index, 1)
		ids.splice(value, 0, this.id)
		await new Promise<void>(r => chrome.storage.local.set({dividers: ids}, () => r()))

		//Post event
		await this.events.fire("reorder", {oldIndex: index, newIndex: value})
	}

	/**
	 * @return The primary section of the divider
	 */
	public async getMainSection(): Promise<Divider.Section> {
		let result = await new Promise<{[key: string]: any}>(r => chrome.storage.local.get(
			this.storageKey,
			items => r(items)
		))

		return result[this.storageKey]
	}

	public async setMainSection(value: Divider.Section): Promise<void> {
		//Update main section
		await new Promise<void>(r => chrome.storage.local.set(
			{[this.storageKey]: value},
			() => r()
		))

		//Post event
		await this.events.fire("changeContents")
	}

	/**
	 * Opens the divider
	 * @param direct Whether to update the page or open in a new tab
	 */
	public async open(direct: boolean): Promise<void> {
		let url = `html/divider.html#${this.id}`

		if(direct)
			await new Promise<void>(r => chrome.tabs.update({url: url}, () => r()))
		else
			await new Promise<void>(r => chrome.tabs.create({url: url}, () => r()))
	}

	/**
	 * Compresses the current tab
	 */
	public async compress(): Promise<void>

	/**
	 * Compresses the tab with the given id
	 * @param id Tab id
	 */
	public async compress(id: number): Promise<void>

	/**
	 * Compresses tabs in the current window matching the predicate
	 * @param predicate Returns whether a tab should be compressed
	 */
	public async compress(predicate: (currentTab: Tab, tab: Tab) => boolean): Promise<void>

	public async compress(par1: any = null): Promise<void> {
		function extractItem(tab: Tab): Divider.Item {
			let item = {
				title: "[Unknown]",
				url: tab.url,
				time: Date.now()
			}

			if(tab.title)
				item.title = tab.title

			return item
		}

		let section = await this.getMainSection()

		if(par1 == null) { //Current tab
			let tab = await new Promise<Tab>(r => chrome.tabs.getSelected(tab => r(tab)))
			section.items.unshift(extractItem(tab))

			await this.setMainSection(section)
			await new Promise<void>(r => chrome.tabs.remove(tab.id, () => r()))
		} else
			switch(typeof par1) {
				case "number": //By tab id
					let tab = await new Promise<Tab>(r => chrome.tabs.get(par1, tab => r(tab)))
					section.items.unshift(extractItem(tab))

					await this.setMainSection(section)
					await new Promise<void>(r => chrome.tabs.remove(tab.id, () => r()))
					break
				case "function": //Tab matching predicate
					let predicate = par1 as (currentTab: Tab, tab: Tab) => boolean
					let currentTab = await new Promise<Tab>(r => chrome.tabs.getCurrent(tab => r(tab)))
					let tabs = await new Promise<Tab[]>(r => chrome.tabs.query(
						{
							"currentWindow": true,
							"pinned": false
						},
						tabs => r(tabs)
					))

					if(currentTab == null)
						throw new Error("Predicate compression unavailable")

					tabs = tabs.filter(t => t.index != currentTab.index && predicate(currentTab, t))

					for(let tab of tabs)
						section.items.unshift(extractItem(tab))

					await this.setMainSection(section)
					await new Promise<void>(r => chrome.tabs.remove(tabs.map(t => t.id), () => r()))
					break
			}
	}

	/**
	 * @param route Path to the item within sections to remove
	 * @param direct Whether to update the page or open in a new tab
	 * @param destructive Whether to remove the item from the divider
	 */
	public async expand(route: Divider.Route, direct: boolean, destructive: boolean): Promise<void> {
		let [path, index] = route

		let mainSection = await this.getMainSection()
		let section = path.reduce((s, i) => s.sections[i], mainSection)
		let item: Divider.Item = null

		if(destructive)
			[item] = section.items.splice(index, 1)
		else
			item = section.items[index]

		if(direct)
			chrome.tabs.update({url: item.url})
		else {
			let tab = await new Promise<Tab>(r => chrome.tabs.getSelected(tab => r(tab)))
			let tabIndex = tab != null ? tab.index + 1 : undefined

			chrome.tabs.create({
				url: item.url,
				active: false,
				index: tabIndex
			})
		}

		if(destructive)
			await this.setMainSection(mainSection)
	}

	/**
	 * @return The name of this divider based on the name of the main section
	 */
	public async getName(): Promise<string> {
		let section = await this.getMainSection()
		return section.name
	}

	/**
	 * Rename to the given value if possible
	 * @param value New name
	 * @return Whether renaming succeeded
	 */
	public async setName(value: string): Promise<boolean> {
		if(value.length == 0) //Prevent renaming to empty string
			return false

		let name = await this.getName()
		if(value == name) //Prevent renaming to same name
			return false

		let names = await Divider.names()
		if(names.indexOf(value) != -1) //Prevent renaming to an existing name
			return false

		//Update section
		let section = await this.getMainSection()
		section.name = value

		await new Promise<void>(r => chrome.storage.local.set(
			{[this.storageKey]: section},
			() => r()
		))

		//Post event
		await this.events.fire("rename", {oldName: name, newName: value})

		return true
	}

	/**
	 * Deletes the divider permanently
	 */
	public async delete(): Promise<void> {
		let index = await this.getIndex()

		//Ignore if the divider doesn't exist
		if(index == -1)
			return

		let ids = await Divider.all()

		//Remove the id and update storage
		ids.splice(index, 1)
		await new Promise<void>(r => chrome.storage.local.set({dividers: ids}, () => r()))

		//Remove contents
		await new Promise<void>(r => chrome.storage.local.remove(this.storageKey, () => r()))

		await this.events.fire("delete", {index: index})
	}

	/**
	 * @returns A newly created copy of this divider
	 */
	public async duplicate(): Promise<Divider> {
		let names = await Divider.names()
		let sourceName = await this.getName()

		let name: string = null
		let index = 0

		do
			name = `${sourceName} (${++index})`
		while(names.indexOf(name) != -1)

		//Create divider and assign duplicate data
		let divider = await Divider.create()

		let section = await this.getMainSection()
		section.name = name

		await new Promise<void>(r => chrome.storage.local.set(
			{[this.storageKey]: section},
			() => r()
		))

		return divider
	}

	/**
	 * Loads a divider by id
	 * @param id Id of the divider
	 * @returns The divider with the associated id if it exists, otherwise null
	 */
	public static async load(id: string): Promise<Divider> {
		let divider = new Divider(id)

		if(await divider.getIndex() == -1)
			return null

		return divider
	}

	/**
	 * Creates a new divider
	 * @param name Name of the divider
	 * @returns The new divider or null if creation wasn't possible
	 */
	public static async create(name: string = null): Promise<Divider> {
		let names = await Divider.names()

		if(name == null) { //Create unused default name
			name = "New Divider"

			let index = 0
			while(names.indexOf(name) != -1)
				name = `New Divider ${++index}`
		} else if(names.indexOf(name) != -1) //Fail since divider already exists
			return null

		//Add the id and update storage
		let id = uuidv4()

		let ids = await Divider.all()
		ids.push(id)
		await new Promise<void>(r => chrome.storage.local.set({dividers: ids}, () => r()))

		//Get divider instance and assign initial data
		let divider = new Divider(id)

		await new Promise<void>(r => chrome.storage.local.set(
			{
				[divider.storageKey]: {
					name: name,
					sections: [],
					items: []
				}
			},
			() => r()
		))

		return divider
	}

	/**
	 * @returns The id of every divider in order
	 */
	public static async all(): Promise<string[]> {
		let result = await new Promise<{[key: string]: any}>(r => chrome.storage.local.get("dividers", items => r(items)))

		//If the value is not an array, return the single value as an array
		if(!Array.isArray(result.dividers))
			return [result.dividers]

		return result.dividers
	}

	/**
	 * @returns The name of every divider in order
	 */
	public static async names(): Promise<string[]> {
		let ids = await Divider.all()
		let dividers = await Promise.all(ids.map(id => Divider.load(id)))
		let names = await Promise.all(dividers.map(d => d.getName()))

		return names
	}
}

export default Divider

export namespace Divider {
	export type Route = [number[], number]

	export interface Section {
		/** Name of this section */
		name: string
	
		/** Subsections containing more items */
		sections: Section[]
	
		/** Items in this subsection */
		items: Item[]
	}
	
	export interface Item {
		/** Item name */
		title: string
	
		/** Address of the page */
		url: string
	
		/** Time when the page was compressed */
		time?: number
	}
}


interface Events {
	/** Called when the divider receives a new name */
	rename: {oldName: string, newName: string}

	/** Called when the divider is given a new order relative to other dividers */
	reorder: {oldIndex: number, newIndex: number}

	/** Called when the divider's main section's contents changes */
	changeContents: void

	/** Called when the divider is deleted */
	delete: {index: number}
}