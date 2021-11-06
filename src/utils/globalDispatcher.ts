import {Dispatcher} from "/resources/lib/cobrasu/core.js"

export default class GlobalDispatcher<Events extends Dispatcher.EventMap> extends Dispatcher<Events> {
	public readonly identifier: string
	private listeners: Map<Dispatcher.Callback.Function, (message: any) => void>

	public constructor(identifier: string, ...events: Dispatcher.EventList<Events>) {
		//@ts-ignore
		super(...events)
		this.identifier = identifier
		this.listeners = new Map<Dispatcher.Callback.Function, (message: any) => void>()
	}

	public override async fire<T extends keyof Events>(event: T, details?: Events[T]): Promise<void> {
		await super.fire(event, details)

		chrome.runtime.sendMessage({
			"identifier": this.identifier,
			"event": event,
			"details": details
		})
	}

	public override on<T extends keyof Events>(event: T, callback: Dispatcher.Callback<Events, T>): Dispatcher.Callback<Events, T> {
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

	public override forget<T extends keyof Events>(event: T, callback: Dispatcher.Callback<Events, T>): void {
		super.forget(event, callback)
		chrome.runtime.onMessage.removeListener(this.listeners.get(callback))
	}
}