import Dispatcher, {Callback, CallbackFunction} from "./dispatcher.js"

export default class GlobalDispatcher<Events extends Record<string | number, any>> extends Dispatcher<Events> {
	public readonly identifier: string
	private listeners: Map<CallbackFunction, (message: any) => void>

	public constructor(identifier: string, events?: (keyof Events)[]) {
		super(events)
		this.identifier = identifier
		this.listeners = new Map<CallbackFunction, (message: any) => void>()
	}

	public async fire<T extends keyof Events>(event: T, details?: Events[T]): Promise<void> {
		await super.fire(event, details)

		chrome.runtime.sendMessage({
			"identifier": this.identifier,
			"event": event,
			"details": details
		})
	}

	public on<T extends keyof Events>(event: T, callback: Callback<Events, T>): Callback<Events, T> {
		let listener = (message: any) => {
			if(message.identifier != this.identifier)
				return
			if(message.event != event)
				return

			callback(message.details)
		}

		chrome.runtime.onMessage.addListener(listener)
		this.listeners.set(callback, listener)

		return super.on(event, callback)
	}

	public forget<T extends keyof Events>(event: T, callback: Callback<Events, T>): void {
		super.forget(event, callback)
		chrome.runtime.onMessage.removeListener(this.listeners.get(callback))
	}
}