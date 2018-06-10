class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    add(p) {
        return new Point(p.x + this.x, p.y + this.y);
    } 

    sub(p) {
        return new Point(this.x - p.x, this.y - p.y);
    }

    rot(angle, centre) {
        const delta = this.sub(centre);

        const rotated_delta = new Point(
            delta.x * Math.cos(angle) - delta.y * Math.sin(angle),
            delta.y * Math.cos(angle) + delta.x * Math.sin(angle));

        return rotated_delta.add(centre);
    }
}

class Polygon {
    constructor(points) {
        this.points = points;
    }
    
    rot(angle, centre) {
        return new Polygon(this.points.map(point => point.rot(angle, centre)));
    }
}

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

    return {
        turn(angle) {
            const new_angle = clamp(this.wheels[0].angle + angle, -turn_limit, turn_limit);
            this.wheels[0].angle = new_angle;
            this.wheels[3].angle = new_angle; 
        },
        accelerate(speed_delta) {
            this.speed += speed_delta;
        },
        angle: 0,
        speed: 0,
        centre: new Point(x, y),
        body: { length, width },
        wheels: [ 
            make_wheel(28, -length/2 + 17, { width: 10, length: 30, angle: 0.5 }), 
            make_wheel(28, length/2 - 17, { width: 10, length: 30 }),
            make_wheel(-28, length/2 - 17, { width: 10, length: 30 }),
            make_wheel(-28, -length/2 + 17, { width: 10, length: 30, angle: 0.5 }), 
        ],
    }
}

function trace_poly(ctx, poly) {
    ctx.beginPath();
    ctx.moveTo(poly.points[0].x, poly.points[0].y);
    for (point of poly.points) {
        ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
}

function make_rectangle(centre, width, length, angle) {
    const top = centre.y - length / 2; 
    const left = centre.x - width / 2;
    const bottom = centre.y + length / 2;
    const right = centre.x + width / 2; 

    return new Polygon([
        new Point(left, top),
        new Point(right, top),
        new Point(right, bottom),
        new Point(left, bottom),
    ]);
}

function render_wheels(ctx, vehicle) {
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
        trace_poly(ctx, wheel);
        ctx.stroke();
    }
}

function render_body(ctx, vehicle) {
    const centre = vehicle.centre;
    const body = vehicle.body;
    const poly = make_rectangle(centre, body.width, body.length);
    const rotated = poly.rot(vehicle.angle, centre);

    trace_poly(ctx, rotated);
    ctx.stroke();
}

function render_guideline(ctx, from_point, to_point) {
    as_guideline(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(from_point.x, from_point.y);
        ctx.lineTo(to_point.x, to_point.y);
        ctx.stroke();        
    });
}

function calc_line_eq(p1, p2) {
    const gradient = (p2.y - p1.y) / (p2.x - p1.x);
    return {
        gradient,
        constant: p1.y - gradient * p1.x, 
    };
}

function eq_from_angle_and_point(angle, point) {
    const gradient = 1/Math.tan(angle);
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

function sub_points(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y,
    }
}

function distance_between_points(p1, p2) {
    const d = sub_points(p1, p2);
    return Math.sqrt(d.x * d.x + d.y * d.y);
}

function as_guideline(ctx, fn) {
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'red';
    fn();
    ctx.restore();
}

function get_turning_circle(vehicle) {
    const max_turning_radius = 1e6;
    const centre = vehicle.centre;
    const eqs = vehicle.wheels.map(wheel => {
        const abs_centre = {
            x: centre.x + wheel.centre.x,
            y: centre.y + wheel.centre.y
        };
        const line_angle = Math.PI/2 - wheel.angle;
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

function render_turning(ctx, vehicle) {
    const centre = vehicle.centre;
    const { point: rotated_int, radius: turning_radius } = get_turning_circle(vehicle);

    if (!rotated_int) {
        render_guideline(ctx, 
            centre.add(vehicle.wheels[0].centre).rot(vehicle.angle, centre), 
            centre.add(vehicle.wheels[1].centre).rot(vehicle.angle, centre));
        return;
    }

    as_guideline(ctx, () => {
        ctx.beginPath();
        ctx.arc(rotated_int.x, rotated_int.y, turning_radius, 0, 2 * Math.PI);
        ctx.stroke();        
    });

    // Guidelines
    const radius = 20;
    for (const wheel of vehicle.wheels) {
        const abs_centre = centre.add(wheel.centre);
        const from_point = abs_centre.rot(vehicle.angle, centre);
        render_guideline(ctx, from_point, rotated_int);
    } 

}

should_draw_guidelines = true;

function render(ctx, vehicle) {
    render_wheels(ctx, vehicle);
    render_body(ctx, vehicle);

    if (should_draw_guidelines) {
        render_turning(ctx, vehicle);
    }
}

function normalise_angle(angle) {
    angle = angle % (2 * Math.PI); // Now between -2pi and +2pi
    if (angle < 0) {
        // 0 and 2pi
        angle = 2 * Math.PI + angle;
    }
        
    return angle; // -pi to +pi;
}

function move(vehicle) {
    const { radius, point, clockwise } = get_turning_circle(vehicle);
    const distance = vehicle.speed;
    let angle_delta = distance / radius;
    angle_delta = clockwise ? angle_delta : -angle_delta;
 
    if (!point) {
        vehicle.centre = vehicle.centre.add(new Point(
            distance * Math.sin(vehicle.angle),
            -distance * Math.cos(vehicle.angle)));
        return;
    }

    vehicle.centre = vehicle.centre.rot(angle_delta, point);
    vehicle.angle = normalise_angle(vehicle.angle + angle_delta);
}

function attach_controller(vehicle) {
    const key_left = 37;
    const key_right = 39;
    const key_up = 38;
    const key_down = 40;
    const key_d = 68;

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

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const render_interval = 1000/50;
    const simulation_interval = 20;

    const bike = make_bike(100, 400);
    bike.speed = 5;

    const car = make_car(600, 400);
    car.turn(-100);
    car.turn(0.3);
    car.speed = 4;

    attach_controller(bike);

    setInterval(() => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        render(ctx, bike);
        render(ctx, car);
    }, render_interval);

    setInterval(() => {
        move(bike);
        move(car);
    }, simulation_interval);

    //setTimeout(() => { location.reload(true)}, 1000);
});
