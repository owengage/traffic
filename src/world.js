/**
 * Currently just a storage place for stuff in the world.
 */
export default class World {
    constructor() {
        this.vehicles = [];
    }

    add_vehicle(vehicle) {
        this.vehicles.push(vehicle);
    }
}

