/**
 * @param value String to simplify
 * @returns Simplified version of original string
 */
export default function simplifyString(value: string) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
}