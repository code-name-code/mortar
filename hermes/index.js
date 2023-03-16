export default class EventBus {
  #_subscriptions = {};
  #_idCounter = 0;

  subscribe(eventName, callback) {
    const id = this.#_idCounter++;
    if (!this.#_subscriptions[eventName]) {
      this.#_subscriptions[eventName] = {};
    }

    this.#_subscriptions[eventName][id] = callback;
    return new Subscription(this.#_subscriptions, eventName, id);
  }

  publish(eventName, content) {
    if (!this.#_subscriptions[eventName]) return;

    for (const key in this.#_subscriptions[eventName]) {
      this.#_subscriptions[eventName][key](content);
    }
  }
}

class Subscription {
  #_subscriptions;
  #_eventName;
  #_id;

  constructor(subscriptions, eventName, id) {
    this.#_subscriptions = subscriptions;
    this.#_eventName = eventName;
    this.#_id = id;
  }
  unsubscribe() {
    delete this.#_subscriptions[this.#_eventName][this.#_id];
    if (
      Object.keys(this.#_subscriptions[this.#_eventName])
        .length === 0
    ) {
      delete this.#_subscriptions[this.#_eventName];
    }
  }
}
