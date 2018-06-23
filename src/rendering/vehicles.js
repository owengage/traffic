import * as brushes from './brushes';

import { make_rectangle } from 'traffic/polygon';
import { render_turning } from './visual-aids';

export function render_wheels(renderer, vehicle) {
    const centre = vehicle.centre;

    // Get polygons as if vehicle is straight.
    let wheel_polys = vehicle.wheels.map(wheel => {
        const abs_centre = centre.add(wheel.centre);

        const poly = make_rectangle(
            abs_centre,
            wheel.width,
            wheel.length);

        return poly.rot(wheel.angle, abs_centre);
    });

    // Then rotate them to match the vehicle.
    wheel_polys = wheel_polys.map(wheel => wheel.rot(vehicle.angle, centre));

    // Draw.
    for (const wheel of wheel_polys) {
        renderer.fill_polygon(brushes.tyre_fill, wheel);
    }
}

export function render_body(renderer, vehicle) {
    const centre = vehicle.centre;
    const body = vehicle.body;
    const poly = make_rectangle(centre, body.width, body.length);
    const rotated = poly.rot(vehicle.angle, centre);

    renderer.fill_polygon(brushes.body_fill_colour(vehicle.body.colour), rotated);
}

function render_routing_point(renderer, vehicle) {
    const p = vehicle.routing_point;
    renderer.stroke_arc(brushes.guideline, p, 10);
}

export function render_vehicle(renderer, vehicle) {
    render_body(renderer, vehicle);
    render_wheels(renderer, vehicle);
    render_routing_point(renderer, vehicle);
    //render_turning(renderer, vehicle);
}
