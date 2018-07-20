import Point from '../point';

import System from '../ecs/system';
import TRANSFORM_KEY from '../ecs/transform-key';

import VEHICLE_KEY from './vehicle-key';
import WHEEL_KEY from './wheel-key';
import { WheelKind } from './wheel-component';

function normalise_angle(angle) {
    const min = -Math.PI; // Minimum allowed normalised value.
    const max = Math.PI; // Max allowed.

    // Many thanks: https://stackoverflow.com/questions/1628386
    const width = max - min;
    const offset = angle - min;
    return (offset - (Math.floor(offset / width) * width)) + min;
}

function calc_line_eq(p1, p2) {
    const gradient = (p2.y - p1.y) / (p2.x - p1.x);
    return {
        gradient,
        constant: p1.y - gradient * p1.x, 
    };
}

function eq_from_angle_and_point(angle, point) {
    const gradient = Math.tan(angle);
    return {
        gradient,
        constant: point.y - gradient * point.x,
    }
}

function calc_intersection_point(eq1, eq2) {
    const x_int = (eq2.constant - eq1.constant) / (eq1.gradient - eq2.gradient);
    return new Point(
        x_int,
        eq1.gradient * x_int + eq1.constant);
}

export default class VehicleSystem extends System {
    constructor() {
        super();
    }

    execute(entities) {
        for (const entity of entities) {
            const vehicle = entity.optional_component(VEHICLE_KEY);
            if (!vehicle) continue;

            // Set the wheels to the correct orientation.
            for (const child of entity.children) {
                for (const wheel of child.components(WHEEL_KEY)) {
                    // Update rotation of tyres.
                    if (wheel.kind === WheelKind.FOLLOW) {
                        child.required_component(TRANSFORM_KEY).rotation = vehicle.turn_angle;
                    }
                }
            }
            
            // Move vehicle according to wheels
            const trans = entity.required_component(TRANSFORM_KEY);
            const { radius, point, clockwise } = this.get_turning_circle(vehicle, trans);
            const distance = vehicle.speed;
            let angle_delta = distance / radius;
            angle_delta = clockwise ? angle_delta : -angle_delta;
         
            if (!point) {
                trans.centre = trans.centre.add(new Point(
                    distance * Math.cos(trans.rotation),
                    distance * Math.sin(trans.rotation)));
                return;
            }
    
            trans.centre = trans.centre.rot(angle_delta, point);
            trans.rotation = normalise_angle(trans.rotation + angle_delta);
        }
    }

    get_turning_circle(vehicle, trans) {
        const anchor_point = vehicle.anchor_point;
        const turn_point = vehicle.turn_point;
        const turn_angle = vehicle.turn_angle;

        const max_turning_radius = 1e5;
        const centre = trans.centre;

        const turn_eq = eq_from_angle_and_point(turn_angle + Math.PI/2, {
            x: centre.x + turn_point.x,
            y: centre.y + turn_point.y
        }); 

        const anchor_eq = eq_from_angle_and_point(Math.PI/2, {
            x: centre.x + anchor_point.x,
            y: centre.y + anchor_point.y
        }); 
        
        const int_point = calc_intersection_point(turn_eq, anchor_eq);

        const wheel_centre = centre.add(turn_point);
        const turning_radius = wheel_centre.distance_to(int_point);

        if (turning_radius > max_turning_radius) {
            return { radius: turning_radius, point: null };
        }    

        const rotated_int = int_point.rot(trans.rotation, centre);
        return {
            point: rotated_int,
            radius: turning_radius,
            clockwise: turn_angle > 0
        }
    }
}