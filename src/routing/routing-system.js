import System from '../ecs/system'
import JOURNEY_KEY from './journey-key';
import VEHICLE_KEY from '../vehicles/vehicle-key'
import TRANSFORM_KEY from '../ecs/transform-key';

export default class RoutingSystem extends System {
    constructor() {
        super();
    }

    execute(entities) {
        for (const entity of entities) {
            const journey = entity.optional_component(JOURNEY_KEY);
            if (journey) {
                const vehicle = entity.required_component(VEHICLE_KEY);
                const trans = entity.required_component(TRANSFORM_KEY);
                const routing_point = vehicle.routing_point.add(trans.centre);

                journey.token = get_active_segment_index(routing_point, journey.token, journey.route.segments);
                const current_segment = journey.route.segments[journey.token];

                const car_wheel_angle = car_wheel_angle_for_segment(trans.rotation, routing_point, current_segment);
                vehicle.turn_angle = car_wheel_angle;
            }
        }
    }
}

function get_active_segment_index(routing_point, segment_index, segments) {
    let current_segment_index = segment_index;
    let current_segment = segments[current_segment_index];
    
    // TODO: If route isn't complete loop, could infinite loop.
    while (!current_segment.is_within_route({routing_point})) {
        current_segment_index = (current_segment_index + 1) % segments.length;
        current_segment = segments[current_segment_index];
    } 

    return current_segment_index;
}

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

function car_wheel_angle_for_segment(vehicle_angle, routing_point, segment) {
    function get_distance_from_segment(routing_point, segment) {
        const { x: x0, y: y0 } = routing_point;
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

    const distance = get_distance_from_segment(routing_point, segment);
    const segment_angle = get_segment_angle(segment);

    const car_wheel_angle = get_desired_car_wheel_angle(distance, segment_angle, vehicle_angle);

    return car_wheel_angle;
}
