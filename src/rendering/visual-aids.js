import Point from 'traffic/point';
import Polygon from 'traffic/polygon';
import { guideline, black } from './brushes';

export function render_turning(renderer, vehicle) {
    const centre = vehicle.centre;
    const { point: rotated_int, radius: turning_radius } = vehicle.get_turning_circle();

    if (!rotated_int) {
        renderer.stroke_polygon(guideline, new Polygon([
            centre.add(vehicle.wheels[0].centre).rot(vehicle.angle, centre), 
            centre.add(vehicle.wheels[1].centre).rot(vehicle.angle, centre)
        ]));
        return;
    }

    renderer.stroke_arc(guideline, rotated_int, turning_radius);

    // Guidelines
    for (const wheel of vehicle.wheels) {
        const abs_centre = centre.add(wheel.centre);
        const from_point = abs_centre.rot(vehicle.angle, centre);
        renderer.stroke_polygon(guideline, new Polygon([ from_point, rotated_int ]));
    } 

}

export function render_compass(renderer, point) {
    const radius = 70;
    const zero_point = point.add(new Point(radius, 0));

    renderer.stroke_arc(guideline, point, 10);
    renderer.stroke_arc(guideline, point, radius, -Math.PI/2, Math.PI/2);
    renderer.stroke_path(guideline, [point, zero_point]);
    renderer.label(zero_point, "0");
    renderer.label(zero_point.rot(Math.PI/2, point), "pi/2");
    renderer.label(zero_point.rot(-Math.PI/2, point), "-pi/2");
}

export function render_fn(renderer, fn, options={}) {
    const start = options.start;
    const end = options.end;
    const step = options.step || 1;
    const offset = options.offset || new Point(0,0);
    const scale_x = options.scale_x || 1;
    const scale_y = options.scale_y || 100;

    const points = [];

    for (let x = start; x < end; x += step) {
        const xx = scale_x * x;
        const yy = -scale_y * fn(x);
        const p = new Point(xx, yy);
        points.push(p.add(offset));
    }
    renderer.stroke_path(black, points);
    renderer.stroke_path(guideline, 
        [new Point(start, 0), new Point(end, 0)]
        .map(p => p.add(offset))
    );
}

