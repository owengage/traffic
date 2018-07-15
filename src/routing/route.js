import RouteSegment from './route-segment';

function segmentise(points) {
    const segments = [];

    for (let i = 0; i < points.length - 1; i++) {
        segments.push(new RouteSegment(points[i], points[i+1]));
    }
    segments.push(new RouteSegment(points[points.length - 1], points[0]));

    return segments;
}

export default class Route {
    constructor(points) {
        this.segments = segmentise(points);
        
    }

    apply_routing_to(vehicle, routing_token=0) {
        let current_segment_index = routing_token;
        let current_segment = this.segments[current_segment_index];
        
        // TODO: If route isn't complete loop, could infinite loop.
        while (!current_segment.is_within_route(vehicle)) {
            current_segment_index = (current_segment_index + 1) % this.segments.length;
            current_segment = this.segments[current_segment_index];
        } 

        current_segment.apply_routing_to(vehicle);
        return current_segment_index;
    }
}
