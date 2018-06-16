import Point from 'traffic/point';
import Renderer from 'traffic/rendering/renderer';
import World from 'traffic/world';
import Car from 'traffic/car';
import RouteSegment from 'traffic/routing/route-segment';

import * as brushes from 'traffic/rendering/brushes'
import { render_compass } from 'traffic/rendering/visual-aids';
import { render_world } from 'traffic/rendering/worlds';
import { render_route_segment } from 'traffic/rendering/routes';
import { attach_view_controller, attach_debug_controls } from 'traffic/controllers';

import _ from 'lodash';

function r(min, max) {
    return Math.random() * (max-min) + min
}

function rp(min, max) {
    return new Point(r(min, max), r(min,max));
}

function sin_loop() {
    const points = [];

    for (let th = 0; th < 2*Math.PI; th += 0.1) {
        points.push(new Point(200*th, 400 + 200 * Math.sin(th)));
    }

    return points;
}

function segmentise(points) {
    const segments = [];

    for (let i = 0; i < points.length - 1; i++) {
        segments.push(new RouteSegment(points[i], points[i+1]));
    }
    segments.push(new RouteSegment(points[points.length - 1], points[0]));

    return segments;
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const render_interval = 1000/50;
    const simulation_interval = render_interval;

    const car = new Car(new Point(r(0,1000), r(0,1000)));
    car.angle = 2 * Math.PI * Math.random();
    car.speed = 10;

    const renderer = new Renderer(ctx, new Point(-300, 0), 0.578);
    attach_view_controller(renderer);

    const world = new World();
    world.add_vehicle(car);

    let current_segment_index = 0;
    const segments = segmentise(sin_loop());

    setInterval(() => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        render_world(renderer, world);
        segments.forEach(s => render_route_segment(renderer, s));
        render_compass(renderer, new Point(-200, 100));
    }, render_interval);


    function simulate_tick() {
        const current_segment = segments[current_segment_index];
        if (current_segment.is_within_route(car)) {
            current_segment.apply_routing_to(car);
        } else {
            current_segment_index = (current_segment_index + 1) % segments.length;
        }
        car.tick();
    }

    attach_debug_controls(simulate_tick);

    setInterval(() => {
        simulate_tick();
    }, simulation_interval);

//    setTimeout(() => { location.reload(true)}, 5000)
});
