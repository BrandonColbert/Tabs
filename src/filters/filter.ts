import {Item} from "../divider.js"

export default interface Filter {
	/** Description of this filter */
	description: string

	/**
	 * @param item Item to check if matching
	 * @param section Nested sections the item is contained in
	 * @returns Whether the item matches the query
	 */
	match(item: Item, path: string[]): boolean
}