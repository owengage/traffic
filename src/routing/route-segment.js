export default class RouteSegment {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    is_within_route(vehicle) {
        // rotate segment so it lines up with x axis
        const centre = vehicle.routing_point;
        const d = this.end.sub(this.start);
        const theta = Math.atan2(d.y, d.x);
        const start_x = this.start.rot(-theta, centre).x;
        const end_x = this.end.rot(-theta, centre).x;
        // see if vehicle is within bounds on x axis
        return centre.x < end_x;
    }
}

