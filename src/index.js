import Point from 'traffic/point';
import Renderer from 'traffic/rendering/renderer';
import World from 'traffic/world';
import Car from 'traffic/car';
import RouteSegment from 'traffic/routing/route-segment';
import { get_desired_car_wheel_angle } from 'traffic/routing/route-segment';

import * as brushes from 'traffic/rendering/brushes'
import { render_fn, render_compass } from 'traffic/rendering/visual-aids';
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

    for (let th = 0; th < 6*Math.PI; th += 0.1) {
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

class Route {
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

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const simulation_interval = 10;

    const car = new Car(rp(0,1000), {
        body: { length: 150, colour: `rgb(${r(30,150)}, ${r(30,150)}, ${r(30,150)})` }
    });
    car.angle = 2 * Math.PI * Math.random();
    car.speed = 15;

    const renderer = new Renderer(canvas, new Point(-300, 0), 0.3);
    attach_view_controller(renderer);

    const world = new World();
    world.add_vehicle(car);

    const route = new Route(sin_loop());
    let token1 = 0;

    const render_frame = () => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        renderer.grid(brushes.line_colour('#eee'), 100);
        render_world(renderer, world);
        route.segments.forEach(s => render_route_segment(renderer, s));
        render_compass(renderer, new Point(-200, 100));

        window.requestAnimationFrame(render_frame);
    }

    window.requestAnimationFrame(render_frame);


    function simulate_tick() {
        token1 = route.apply_routing_to(car, token1);
        car.tick();
        renderer.centre = car.centre;;
    }

    attach_debug_controls(simulate_tick);

    setInterval(() => {
        simulate_tick();
    }, simulation_interval);

});
