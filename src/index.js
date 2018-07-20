import Point from 'traffic/point'
import { make_rectangle } from 'traffic/polygon'
import Renderer from 'traffic/rendering/renderer'
import Route from 'traffic/routing/route'

import * as brushes from 'traffic/rendering/brushes'
import { render_route_segment } from 'traffic/rendering/routes'
import { attach_view_controller, attach_debug_controls } from 'traffic/controllers'

import Entity from './ecs/entity'
import TransformComponent from './ecs/transform-component'
import RenderSystem from './rendering/render-system'
import BrushComponent from './rendering/brush-component'
import PolygonComponent from './rendering/polygon-component'

import VehicleSystem from './vehicles/vehicle-system'
import WheelComponent, { WheelKind } from './vehicles/wheel-component'
import VehicleComponent from './vehicles/vehicle-component'

import RoutingSystem from './routing/routing-system'
import LoopedJourneyComponent from './routing/looped-journey-component'

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

const car_polygon = new PolygonComponent(make_rectangle(new Point(0,0), 70, 150));
const car_brush = new BrushComponent(brushes.body_fill_colour('#666'));
const tyre_polygon = new PolygonComponent(make_rectangle(new Point(0,0), 10, 35));
const tyre_brush = new BrushComponent(brushes.black);

function add_tyre_render_components(tyre) {
    tyre.add_component(tyre_polygon);
    tyre.add_component(tyre_brush);
}

function make_tyre(entities, kind, car_entity, centre) {
    const tyre = new Entity();
    tyre.add_component(new TransformComponent(centre, 0.0));
    tyre.add_component(new WheelComponent(kind));
    tyre.parent = car_entity;
    add_tyre_render_components(tyre);
    entities.push(tyre);
    return tyre;
}

function make_car_entity(entities, centre, colour='#e66') {
    const car_entity = new Entity();
    const turn_point = new Point(52, 26);
    const anchor_point = new Point(-52, 26);
    const routing_point = new Point(52, 0);
    const vehicle_comp = new VehicleComponent(turn_point, anchor_point, routing_point);

    vehicle_comp.turn_angle = 0.3;

    car_entity.add_component(new TransformComponent(centre, 0));
    car_entity.add_component(car_polygon);
    car_entity.add_component(new BrushComponent(brushes.body_fill_colour(colour)));
    car_entity.add_component(vehicle_comp);
    entities.push(car_entity);

    make_tyre(entities, WheelKind.FOLLOW, car_entity, turn_point);
    make_tyre(entities, WheelKind.STATIC, car_entity, anchor_point);
    make_tyre(entities, WheelKind.FOLLOW, car_entity, new Point(52, -26));
    make_tyre(entities, WheelKind.STATIC, car_entity, new Point(-52, -26));

    return car_entity;
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const simulation_interval = 1000/50;

    const renderer = new Renderer(canvas, new Point(-300, 0), 0.57);

    const entities = [];
    const render_system = new RenderSystem(renderer);
    const vehicle_system = new VehicleSystem();
    const routing_system = new RoutingSystem();

    const car_entity1 = make_car_entity(entities, new Point(0,-400), 'red');
    const car_entity2 = make_car_entity(entities, new Point(0,0), 'green');
    const car_entity3 = make_car_entity(entities, new Point(0,400), 'blue');

    const sine_route = new Route(sin_loop());
    car_entity1.add_component(new LoopedJourneyComponent(sine_route));
    car_entity2.add_component(new LoopedJourneyComponent(sine_route));
    car_entity3.add_component(new LoopedJourneyComponent(sine_route));

    attach_view_controller(renderer);
   
    const render_frame = () => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        renderer.grid(brushes.line_colour('#eee'), 100);
        sine_route.segments.forEach(s => render_route_segment(renderer, s));

        render_system.execute(entities);

        window.requestAnimationFrame(render_frame);
    }

    window.requestAnimationFrame(render_frame);

    function simulate_tick() {
        vehicle_system.execute(entities);
        routing_system.execute(entities);
    }

    setInterval(() => {
        simulate_tick();
    }, simulation_interval);

});
