export default class LoopedJourney {
    constructor(route, vehicle) {
        this.route = route;
        this.vehicle = vehicle;
        this.token = 0;
    }

    aim() {
       this.token = this.route.apply_routing_to(this.vehicle, this.token); 
    }
};
