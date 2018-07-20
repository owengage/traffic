export default class Component {
    constructor() {}

    get_key() {
        if (this.key) return this.key;
        throw new TypeError("get_key not overridden, or key not set");
    }
}