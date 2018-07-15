import _ from 'lodash';

function normalise_angle(angle) {
    const min = -Math.PI; // Minimum allowed normalised value.
    const max = Math.PI; // Max allowed.

    // Many thanks: https://stackoverflow.com/questions/1628386
    const width = max - min;
    const offset = angle - min;
    return (offset - (Math.floor(offset / width) * width)) + min;
}

/**
 * Get the angle the wheel should have relative to the car in order to
 * get closer to the segment given by the angle and distance.
 *
 * Based on summing up two components:-
 *  1. A sine wave that acts to try and make the car become parallel to the
 *     segment.
 *  2. An bell curve that scales with the distance to direct the vehicle closer
 *     to the segment.
 *
 * The sum of these make it try to align with *and* get closer if it is far
 * away from the segment.
 */
function get_desired_car_wheel_angle(distance, segment_angle, vehicle_angle) {
    const distance_for_perpendicular_wheel = 500;
    const half_pi = Math.PI / 2;
    const vehicle_segment_angle = normalise_angle(vehicle_angle - segment_angle);
    
    if (vehicle_segment_angle > half_pi) {
        return -half_pi;
    }

    if (vehicle_segment_angle < -half_pi) {
        return +half_pi;
    }

    const segment_alignment_component = half_pi * -Math.sin(vehicle_segment_angle);

    const clamped_distance = _.clamp(distance, -70, 70);
    const towards_segment_component = -clamped_distance/70 * 
            Math.exp(-2*Math.pow(vehicle_segment_angle, 2));

    return segment_alignment_component + towards_segment_component;
}

/**
 * Set the wheels of vehicle to aim for the given segment.
 */
function aim_towards_segment(vehicle, segment) {
    function get_distance_from_segment(vehicle, segment) {
        const { x: x0, y: y0 } = vehicle.routing_point;
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
    const segment_angle = get_segment_angle(segment);

    const car_wheel_angle = get_desired_car_wheel_angle(distance, segment_angle, vehicle.angle);

    vehicle.turn_to(car_wheel_angle);
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
        const centre = vehicle.routing_point;
        const d = this.end.sub(this.start);
        const theta = Math.atan2(d.y, d.x);
        const start_x = this.start.rot(-theta, centre).x;
        const end_x = this.end.rot(-theta, centre).x;
        // see if vehicle is within bounds on x axis
        return centre.x < end_x;
    }
}

