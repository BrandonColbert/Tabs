import Divider from "../divider.js"

export default interface Filter {
	/** Description of this filter */
	readonly description: string

	/**
	 * @param item Item to check if matching
	 * @param section Nested sections the item is contained in
	 * @returns Whether the item matches the query
	 */
	match(item: Divider.Item, path: string[]): boolean
}