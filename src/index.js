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

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const render_interval = 1000/50;
    const simulation_interval = render_interval;

    const car = new Car(new Point(Math.random() * 100, Math.random() * 1000 + 500));
    car.angle = 2 * Math.PI * Math.random();
    car.speed = 10;

    const renderer = new Renderer(ctx, new Point(-300, 0), 0.578);
    attach_view_controller(renderer);

    const world = new World();
    const segment = new RouteSegment(new Point(-200, 500), new Point(900, 0));
    world.add_vehicle(car);
    
    setInterval(() => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        render_world(renderer, world);
        render_route_segment(renderer, segment);
        render_compass(renderer, new Point(-200, 100));
    }, render_interval);

    function simulate_tick() {
        segment.apply_routing_to(car);
        car.tick();
    }

    attach_debug_controls(simulate_tick);

    setInterval(() => {
        simulate_tick();
    }, simulation_interval);

//    setTimeout(() => { location.reload(true)}, 5000)
});
