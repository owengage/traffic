import Point from 'traffic/point';
import { make_rectangle } from 'traffic/polygon';
import Renderer from 'traffic/rendering/renderer';
import World from 'traffic/world';
import Car from 'traffic/car';
import Route from 'traffic/routing/route';
import LoopedJourney from 'traffic/routing/looped-journey';
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

class Component {
    constructor() {}

    get_key() {
        if (this.key) return this.key;
        throw new TypeError("get_key not overridden, or key not set");
    }
}

class Entity {
    constructor() {
        this._id = _.uniqueId('entity-');
        this._components = {};
        this._parent = null;
        this._children = [];
    }

    get parent() {
        return this._parent;
    }

    get children() {
        return this._children;
    }

    set parent(parent_entity) {
        this._parent = parent_entity;
        parent_entity.add_entity(this);
    }

    add_entity(entity) {
        this._children.push(entity);
    }


    add_component(component) {
        const key = component.get_key();
        this._components[key] = this._components[key] || [];
        this._components[key].push(component);
    }

    components(key) {
        if (key && typeof key === "symbol") {
            return this._components[key] || [];
        }
        else {
            throw new Error("key must be a symbol");
        }
    }

    optional_component(key) {
        if (key && typeof key === "symbol") {
            const comps = this._components[key] || [];
            if (comps.length <= 1) {
                return comps[0] || null;
            } else {
                throw new Error(`Wanted single component with ${key.toString()}, found multiple.`);
            }
        }
        else {
            throw new Error("key must be a symbol");
        }
    }

    required_component(key) {
        if (key && typeof key === "symbol") {
            const comps = this._components[key] || [];
            if (comps.length === 1) {
                return comps[0];
            } else if (comps.length === 0) {
                throw new Error(`Require single component with ${key.toString()}, found none.`);
            } else {
                throw new Error(`Require single component with ${key.toString()}, found multiple.`);
            }
        }
        else {
            throw new Error("key must be a symbol");
        }
    }

    get_overall_transform() {
        const lineage = [this.required_component(TRANSFORM_KEY)];

        let parent = this.parent;
        while (parent) {
            lineage.push(parent.required_component(TRANSFORM_KEY));
            parent = parent.parent;
        }
        
        let transform = new TransformComponent(new Point(0,0), 0);
        for (const trans of lineage.reverse()) {
            transform = transform.apply(trans);
        }

        return transform;
    }
}

class System {
    constructor(entities) {
        this._entities = entities;
    }
}

class RenderSystem extends System {
    constructor(renderer) { 
        super();
        this._renderer = renderer;
    }

    execute(entities) {
        for (const entity of entities) {
            const renderables = entity.components(RENDER_KEY);
            if (renderables.length === 0) continue;

            const transform = entity.get_overall_transform();
            const brush = entity.required_component(BRUSH_KEY);

            for (const comp of renderables) {
                this._renderer.fill_polygon(brush.brush, comp.polygon
                        .trans(transform.centre)
                        .rot(transform.rotation, transform.centre));
            }
        }
    }
}

class VehicleSimulationSystem extends System {
    constructor() {
        super();
    }

    execute(entities) {
        for (const entity of entities) {
            const vehicle = entity.optional_component(VEHICLE_KEY);
            if (!vehicle) continue;

            for (const child of entity.children) {
                for (const wheel of child.components(WHEEL_KEY)) {
                    if (wheel.kind === WheelKind.FOLLOW) {
                        child.required_component(TRANSFORM_KEY).rotation = vehicle.turn_angle;
                    }
                }
            }
        }
    }
}

const BRUSH_KEY = Symbol("brush_key");
const RENDER_KEY = Symbol("render_key");
const TRANSFORM_KEY = Symbol("transform_key");
const WHEEL_KEY = Symbol("wheel_key");
const VEHICLE_KEY = Symbol("vehicle_key");

class VehicleComponent extends Component {
    constructor() {
        super();
        this.key = VEHICLE_KEY;
        this.turn_angle = 0;
    }
}

const WheelKind = {
    STATIC: 'fixed',
    FOLLOW: 'follow',
};

class WheelComponent extends Component {
    
    constructor(kind) {
        super();
        if (!kind) throw new Error('Must provide kind for wheel');
        this.key = WHEEL_KEY;
        this.kind = kind;
    }
}

class TransformComponent extends Component {
    constructor(centre, rotation) {
        super()
        this.key = TRANSFORM_KEY;
        this.centre = centre;
        this.rotation = rotation;
    }

    apply(transform) {
        const centre = this.centre.add(transform.centre.rot(this.rotation, new Point(0,0)));   
        const rotation = this.rotation + transform.rotation;
        return new TransformComponent(centre, rotation);
        
    }
}


class PolygonComponent extends Component {
    constructor(polygon) {
        super();
        this.key = RENDER_KEY;
        this.polygon = polygon;
    }

}

class BrushComponent extends Component {
    constructor(brush) {
        super();
        this.key = BRUSH_KEY;
        this.brush = brush;
    }
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

function make_car_entity(entities, centre) {
    const car_entity = new Entity();
    const vehicle_comp = new VehicleComponent();
    vehicle_comp.turn_angle = 0.3;

    car_entity.add_component(new TransformComponent(centre, 0));
    car_entity.add_component(car_polygon);
    car_entity.add_component(car_brush);
    car_entity.add_component(vehicle_comp);
    entities.push(car_entity);

    make_tyre(entities, WheelKind.FOLLOW, car_entity, new Point(52, 26));
    make_tyre(entities, WheelKind.FOLLOW, car_entity, new Point(52, -26));
    make_tyre(entities, WheelKind.STATIC, car_entity, new Point(-52, 26));
    make_tyre(entities, WheelKind.STATIC, car_entity, new Point(-52, -26));

    return car_entity;
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const simulation_interval = 1000;

    const car = new Car(rp(0,1000), {
        body: { length: 150, colour: `rgb(${r(30,150)}, ${r(30,150)}, ${r(30,150)})` }
    });
    car.angle = 2 * Math.PI * Math.random();
    car.speed = 5;

    const renderer = new Renderer(canvas, new Point(-300, 0), 0.57);

    // Entity framework stuff.
    
    const entities = [];
    const render_system = new RenderSystem(renderer);
    const vehicle_system = new VehicleSimulationSystem();

    const car_entity1 = make_car_entity(entities, new Point(0,0));
    const car_entity2 = make_car_entity(entities, new Point(0,100));
    const car_entity3 = make_car_entity(entities, new Point(0,200));

    // end entity stuff

    attach_view_controller(renderer);

    const world = new World();
    world.add_vehicle(car);

    const route = new Route(sin_loop());
    const journey = new LoopedJourney(route, car);

    const render_frame = () => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        renderer.grid(brushes.line_colour('#eee'), 100);
        render_world(renderer, world);
        route.segments.forEach(s => render_route_segment(renderer, s));
        render_compass(renderer, new Point(-200, 100));

        render_system.execute(entities);

        window.requestAnimationFrame(render_frame);
    }

    window.requestAnimationFrame(render_frame);

    function simulate_tick() {
        vehicle_system.execute(entities);
        journey.aim();
        car.tick();
        //renderer.centre = car.centre;;
    }

    attach_debug_controls(simulate_tick);

    setInterval(() => {
        simulate_tick();
    }, simulation_interval);

});
