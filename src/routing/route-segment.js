function get_desired_absolute_wheel_angle(distance) {
    const distance_for_perpendicular_wheel = 400;
    const half_pi = Math.PI / 2;

    if (distance > distance_for_perpendicular_wheel) {
        return -half_pi;
    }

    if (-distance > distance_for_perpendicular_wheel) {
        return +half_pi;
    }
    return half_pi * -Math.sin(half_pi * distance / distance_for_perpendicular_wheel);
}

function aim_towards_segment(vehicle, segment) {
    function get_distance_from_segment(vehicle, segment) {
        const { x: x0, y: y0 } = vehicle.centre;
        const { x: x1, y: y1 } = segment.start;
        const { x: x2, y: y2 } = segment.end;
     
        const numerator = (y2 - y1)*x0 - (x2 - x1)*y0 + x2*y1 - y2*x1;
        const denominator = segment.start.distance_to(segment.end);
        return -numerator/denominator;
    }

    function get_segment_angle(segment) {
        const delta = segment.end.sub(segment.start);
        return Math.atan2(delta.y, delta.x);
    }

    const distance = get_distance_from_segment(vehicle, segment);
    const absolute_angle = get_desired_absolute_wheel_angle(distance);
    const segment_angle = get_segment_angle(segment);

    vehicle.turn_to(absolute_angle + segment_angle - vehicle.angle);
}

export default class RouteSegment {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    apply_routing_to(vehicle) {
        aim_towards_segment(vehicle, this);
    }

    is_within_route(vehicle) {
        // rotate segment so it lines up with x axis
        const centre = vehicle.centre;
        const d = this.end.sub(this.start);
        const theta = Math.atan2(d.y, d.x);
        const start_x = this.start.rot(-theta, centre).x;
        const end_x = this.end.rot(-theta, centre).x;
        // see if vehicle is within bounds on x axis
        return centre.x < end_x;
    }
}

