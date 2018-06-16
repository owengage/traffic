import Point from './point';
import Polygon from './polygon';
import Renderer from './renderer';

function clamp(value, min, max) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
}

function make_wheel(x, y, options={}) {
    options = {
        width: options.width || 15,
        length: options.length || 30,
        angle: options.angle || 0,
    };
    return {
        centre: new Point(x, y),
        angle: options.angle,
        length: options.length,
        width: options.width,
    };
}

function make_bike(x, y) {
    const length = 70;
    const width = 20;
    const turn_limit = 1;

    return {
        turn(angle) {
            const current = this.wheels[0].angle;
            this.wheels[0].angle = clamp(current + angle, -turn_limit, turn_limit);
        },
        accelerate(speed_delta) {
            this.speed += speed_delta;
        },
        angle: 0,
        speed: 0,
        centre: new Point(x, y),
        body: { length, width },
        wheels: [ 
            make_wheel(0, -length/2, { width: 10, angle: 0.5 }), 
            make_wheel(0, length/2)
        ],
    }
}

function make_car(x, y) {
    const length = 150;
    const width = 70;
    const turn_limit = 1;
    const wheel_opts = { width: 10, length: 30, angle: 0 };

    return {
        turn(angle) {
            const new_angle = clamp(this.wheels[0].angle + angle, -turn_limit, turn_limit);
            this.wheels[0].angle = new_angle;
            this.wheels[3].angle = new_angle; 
        },
        turn_to(angle) {
            angle = clamp(normalise_angle(angle), -turn_limit, turn_limit);
            this.wheels[0].angle = angle;
            this.wheels[3].angle = angle; 
        },
        accelerate(speed_delta) {
            this.speed += speed_delta;
        },
        angle: 0,
        speed: 0,
        centre: new Point(x, y),
        body: { length, width },
        wheels: [ 
            make_wheel(length/2 - 17, 28, {...wheel_opts}), // front right
            make_wheel(-length/2 + 17, 28,{...wheel_opts}), // back right
            make_wheel(-length/2 + 17, -28, {...wheel_opts}), // back left
            make_wheel(length/2 - 17, -28, {...wheel_opts}),  // front left
        ],
    }
}


/**
 * Make rectangle at angle '0', so lying on its side.
 */
function make_rectangle(centre, width, length) {
    const top = centre.y + width / 2; 
    const bottom = centre.y - width / 2;
    const left = centre.x + length / 2;
    const right = centre.x - length / 2; 

    return new Polygon([
        new Point(left, top),
        new Point(right, top),
        new Point(right, bottom),
        new Point(left, bottom),
    ]);
}

function render_wheels(renderer, vehicle) {
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
        renderer.fill_polygon(tyre_fill_brush, wheel);
    }
}

function render_body(renderer, vehicle) {
    const centre = vehicle.centre;
    const body = vehicle.body;
    const poly = make_rectangle(centre, body.width, body.length);
    const rotated = poly.rot(vehicle.angle, centre);

    renderer.fill_polygon(body_fill_brush, rotated);
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

function distance_between_points(p1, p2) {
    const d = p1.sub(p2);
    return Math.sqrt(d.x * d.x + d.y * d.y);
}

function get_turning_circle(vehicle) {
    const max_turning_radius = 1e5;
    const centre = vehicle.centre;
    const eqs = vehicle.wheels.map(wheel => {
        const abs_centre = {
            x: centre.x + wheel.centre.x,
            y: centre.y + wheel.centre.y
        };
        const line_angle = wheel.angle + Math.PI/2;
        return eq_from_angle_and_point(line_angle, abs_centre); 
    });

    const int_point = calc_intersection_point(eqs[0], eqs[1])
    const first_wheel = vehicle.wheels[0];
    const wheel_centre = centre.add(first_wheel.centre);
    const turning_radius = distance_between_points(wheel_centre, int_point);

    if (turning_radius > max_turning_radius) {
        return { radius: turning_radius, point: null };
    }    

    const rotated_int = int_point.rot(vehicle.angle, centre);
    return {
        point: rotated_int,
        radius: turning_radius,
        clockwise: vehicle.wheels[0].angle > 0
    }
}

const black_brush = {
    activate(ctx) {}
}

const guideline_brush = {
    activate(ctx) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'red';
    }
};

const body_fill_brush = {
    activate(ctx) {
        ctx.fillStyle = '#369';
    }
};

const tyre_fill_brush = {
    activate(ctx) {
        ctx.fillStyle = '#000';
    }
};

function render_turning(renderer, vehicle) {
    const centre = vehicle.centre;
    const { point: rotated_int, radius: turning_radius } = get_turning_circle(vehicle);

    if (!rotated_int) {
        renderer.stroke_polygon(guideline_brush, new Polygon([
            centre.add(vehicle.wheels[0].centre).rot(vehicle.angle, centre), 
            centre.add(vehicle.wheels[1].centre).rot(vehicle.angle, centre)
        ]));
        return;
    }

    renderer.stroke_arc(guideline_brush, rotated_int, turning_radius);

    // Guidelines
    for (const wheel of vehicle.wheels) {
        const abs_centre = centre.add(wheel.centre);
        const from_point = abs_centre.rot(vehicle.angle, centre);
        renderer.stroke_polygon(guideline_brush, new Polygon([ from_point, rotated_int ]));
    } 

}

let should_draw_guidelines = true;

function render_vehicle(renderer, vehicle) {
    render_body(renderer, vehicle);
    render_wheels(renderer, vehicle);

    if (should_draw_guidelines) {
        render_turning(renderer, vehicle);
    }
}

function normalise_angle(angle) {
    const min = -Math.PI; // Minimum allowed normalised value.
    const max = Math.PI; // Max allowed.

    // Many thanks: https://stackoverflow.com/questions/1628386
    const width = max - min;
    const offset = angle - min;
    return (offset - (Math.floor(offset / width) * width)) + min;
}

function move(vehicle) {
    const { radius, point, clockwise } = get_turning_circle(vehicle);
    const distance = vehicle.speed;
    let angle_delta = distance / radius;
    angle_delta = clockwise ? angle_delta : -angle_delta;
 
    if (!point) {
        vehicle.centre = vehicle.centre.add(new Point(
            distance * Math.cos(vehicle.angle),
            -distance * Math.sin(vehicle.angle)));
        return;
    }

    vehicle.centre = vehicle.centre.rot(angle_delta, point);
    vehicle.angle = normalise_angle(vehicle.angle + angle_delta);
}

// checked for new compass.
function get_desired_absolute_wheel_angle(distance) {
    const distance_for_perpendicular_wheel = 400;
    const half_pi = Math.PI / 2;

    if (distance > distance_for_perpendicular_wheel) {
        return -half_pi;
    }

    if (-distance > distance_for_perpendicular_wheel) {
        return +half_pi;
    }
    return half_pi * -Math.sin(half_pi * distance / distance_for_perpendicular_wheel);
}

function move_towards_segment(vehicle, segment) {
    // checked for new compass.
    function get_distance_from_segment(vehicle, segment) {
        const { x: x0, y: y0 } = vehicle.centre;
        const { x: x1, y: y1 } = segment.start;
        const { x: x2, y: y2 } = segment.end;
     
        const numerator = (y2 - y1)*x0 - (x2 - x1)*y0 + x2*y1 - y2*x1;
        const denominator = distance_between_points(segment.start, segment.end);
        return -numerator/denominator;
    }

    // checked for new compass.
    function get_segment_angle(segment) {
        const delta = segment.end.sub(segment.start);
        return Math.atan2(delta.y, delta.x);
    }

    const distance = get_distance_from_segment(vehicle, segment);
    const absolute_angle = get_desired_absolute_wheel_angle(distance);
    const segment_angle = get_segment_angle(segment);

    vehicle.turn_to(absolute_angle + segment_angle - vehicle.angle);
    move(vehicle);
}

const key_left = 37;
const key_right = 39;
const key_up = 38;
const key_down = 40;


function attach_view_controller(renderer) {
    function on_keypress(event) {
        switch (event.keyCode) {
            case key_left:
                renderer.centre = renderer.centre.add(new Point(-100, 0));
                break;
            case key_right:
                renderer.centre = renderer.centre.add(new Point(100, 0));
                break; 
            case key_up:
                renderer.centre = renderer.centre.add(new Point(0, -100));
                break;
            case key_down:
                renderer.centre = renderer.centre.add(new Point(0, 100));
                break;
            case 0:
                if (event.key == '+') renderer.scale *= 1.1;
                if (event.key == '=') renderer.scale *= 1.1;
                if (event.key == '-') renderer.scale *= 1/1.1;
                if (event.key == 'd') console.log(renderer);
                break;
        }
    }
    document.addEventListener('keypress', on_keypress);
}

function attach_controller(vehicle) {
    function on_keypress(event) {
        switch (event.keyCode) {
            case key_left:
                vehicle.turn(-0.1);
                break;
            case key_right:
                vehicle.turn(0.1);
                break; 
            case key_up:
                vehicle.accelerate(1);
                break;
            case key_down:
                vehicle.accelerate(-1);
                break;
            case 0:
                if (event.key == 'd') console.debug('Debug print', vehicle);
                if (event.key == 'g') should_draw_guidelines = !should_draw_guidelines;
                break;
        }
    }
    document.addEventListener('keypress', on_keypress);
}

function attach_debug_controls(simulate_fn) {
    function on_keypress(event) {
        switch (event.keyCode) {
            case 0:
                if (event.key == 's') simulate_fn();
                break;
        }
    }
    document.addEventListener('keypress', on_keypress);
}

/**
 * Currently just a storage place for stuff in the world.
 */
class World {
    constructor() {
        this.vehicles = [];
    }

    add_vehicle(vehicle) {
        this.vehicles.push(vehicle);
    }
}

function render_view(renderer, world) {
    for (const v of world.vehicles) {
        render_vehicle(renderer, v);
    } 
}

function render_path_segment(renderer, segment) {
    renderer.stroke_polygon(guideline_brush, new Polygon([
        segment.start,
        segment.end
    ])) 

    renderer.stroke_arc(guideline_brush, segment.end, 10);
    renderer.label(segment.start, "start");
    renderer.label(segment.end, "end");
}

class PathSegment {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
}

function render_fn(renderer, fn, options={}) {
    const start = options.start;
    const end = options.end;
    const step = options.step || 1;
    const offset = options.offset || new Point(0,0);
    const scale_x = options.scale_x || 1;
    const scale_y = options.scale_y || 100;

    const points = [];

    for (let x = start; x < end; x += step) {
        const p = new Point(scale_x * x, -scale_y * fn(x));
        points.push(p.add(offset));
    }
    renderer.stroke_path(black_brush, points);
    renderer.stroke_path(guideline_brush, 
        [new Point(start, 0), new Point(end, 0)]
        .map(p => p.add(offset))
    );
}

function render_compass(renderer, point) {
    const radius = 70;
    const zero_point = point.add(new Point(radius, 0));

    renderer.stroke_arc(guideline_brush, point, 10);
    renderer.stroke_arc(guideline_brush, point, radius, -Math.PI/2, Math.PI/2);
    renderer.stroke_path(guideline_brush, [point, zero_point]);
    renderer.label(zero_point, "0");
    renderer.label(zero_point.rot(Math.PI/2, point), "pi/2");
    renderer.label(zero_point.rot(-Math.PI/2, point), "-pi/2");
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const render_interval = 1000/50 //50;
    const simulation_interval = render_interval;

    const car = make_car(Math.random() * 1000, Math.random() * 1000 + 500);
    //const car = make_car(500, 800);
    //const car = make_car(100, 800);
    car.angle = 2 * Math.PI * Math.random();//Math.PI/2;
    car.speed = 10;

    console.debug(car);

    const renderer = new Renderer(ctx, new Point(-300, 0), 0.578);
    attach_view_controller(renderer);

    const world = new World();
    const segment = new PathSegment(new Point(-200, 500), new Point(900, 0));
    world.add_vehicle(car);
    
    setInterval(() => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        render_view(renderer, world);
        render_path_segment(renderer, segment);

        render_compass(renderer, new Point(-200, 100));

        //render_fn(renderer, get_desired_absolute_wheel_angle, {
        //    start: -600, end: 600, step: 50, offset: new Point(500, 300),
        //});
    }, render_interval);

    function simulate_tick() {
//        move(car);
        move_towards_segment(car, segment);
    }

    attach_debug_controls(simulate_tick);

    setInterval(() => {
        simulate_tick();
    }, simulation_interval);

    setTimeout(() => { location.reload(true)}, 3000);
});
