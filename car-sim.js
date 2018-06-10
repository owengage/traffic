function make_wheel(x, y, options={}) {
    options = {
        width: options.width || 15,
        angle: options.angle || 0,
    };
    return {
        centre: { x, y },
        angle: options.angle,
        length: 30,
        width: options.width,
    };
}

function clamp(value, min, max) {
    if (value > max) return max;
    if (value < min) return min;
    return value;
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
        centre: { x, y },
        body: { length, width },
        wheels: [ 
            make_wheel(0, -length/2, { width: 10, angle: 0.5 }), 
            make_wheel(0, length/2)
        ],
    }
}

function trace_poly(ctx, poly) {
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (point of poly) {
        ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
}

function rectangle(centre, width, length, angle) {
    const top = centre.y - length / 2; 
    const left = centre.x - width / 2;
    const bottom = centre.y + length / 2;
    const right = centre.x + width / 2; 

    return [
        { x:left, y:top },
        { x:right, y:top },
        { x:right, y:bottom },
        { x:left, y:bottom },
    ];
}

function rotate_point(point, centre, angle) {
    const delta = {
        x: point.x - centre.x,
        y: point.y - centre.y,
    };

    const rotated_delta = {
        x: delta.x * Math.cos(angle) - delta.y * Math.sin(angle),
        y: delta.y * Math.cos(angle) + delta.x * Math.sin(angle)
    };

    return {
        x: rotated_delta.x + centre.x,
        y: rotated_delta.y + centre.y,
    };
}

function rotate_poly(poly, centre, angle) {
    return poly.map(point => rotate_point(point, centre, angle));
}

function render_wheels(ctx, vehicle) {
    const centre = vehicle.centre;

    // Get polygons as if vehicle is straight.
    let wheel_polys = vehicle.wheels.map(wheel => {
        const abs_centre = {
            x: centre.x + wheel.centre.x,
            y: centre.y + wheel.centre.y
        };

        const poly = rectangle(
            abs_centre,
            wheel.width,
            wheel.length);

        return rotate_poly(poly, abs_centre, wheel.angle);
    });

    // Then rotate them to match the vehicle.
    wheel_polys = wheel_polys.map(wheel => rotate_poly(wheel, centre, vehicle.angle));

    // Draw.
    for (const wheel of wheel_polys) {
        trace_poly(ctx, wheel);
        ctx.stroke();
    }
}

function render_body(ctx, vehicle) {
    const centre = vehicle.centre;
    const body = vehicle.body;
    const poly = rectangle(centre, body.width, body.length);
    const rotated = rotate_poly(poly, centre, vehicle.angle);

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
    return {
        x: x_int,
        y: eq1.gradient * x_int + eq1.constant,
    };
}

function add_points(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y,
    }
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
    const wheel_centre = add_points(centre, first_wheel.centre);
    const turning_radius = distance_between_points(wheel_centre, int_point);

    if (turning_radius == Infinity) {
        return { radius: turning_radius, point: null };
    }    

    const rotated_int = rotate_point(int_point, centre, vehicle.angle);
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
        // Going straight.
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
        const abs_centre = add_points(centre, wheel.centre);
        const from_point = rotate_point(abs_centre, centre, vehicle.angle);
        render_guideline(ctx, from_point, rotated_int);
    } 

}

function render(ctx, vehicle) {
    ctx.save();
    ctx.scale(0.5, 0.5);
    render_wheels(ctx, vehicle);
    render_body(ctx, vehicle);
    render_turning(ctx, vehicle);
    ctx.restore();
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
        vehicle.centre = add_points(vehicle.centre, {
            x: distance * Math.sin(vehicle.angle),
            y: -distance * Math.cos(vehicle.angle),
        });
        return;
    }

    vehicle.centre = rotate_point(vehicle.centre, point, angle_delta);
    vehicle.angle = normalise_angle(vehicle.angle + angle_delta);
}

function attach_controller(vehicle) {
    const key_left = 37;
    const key_right = 39;
    const key_up = 38;
    const key_down = 40;

    console.log('Attaching controller');
    function on_keypress(event) {
        console.log('Key pressed!', event);

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
        }
    }
    document.addEventListener('keypress', on_keypress);
}

/**
 * todo:
 *  - Push vehicle!
 *  - Animate!
 *  - Figure 8!
 * bug:
 *  - Wheel rotation of 90deg doesn't produce correct turning circle.
 *
 */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');

    const bike = make_bike(800, 800);
    const bike2 = make_bike(500, 800);
    const render_interval = 1000/50;
    const simulation_interval = 20;

    bike2.wheels[0].angle = 0.2;
    bike2.speed = 10; 

    attach_controller(bike);

    setInterval(() => {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        render(ctx, bike);
        render(ctx, bike2);
    }, render_interval);

    setInterval(() => {
        move(bike);
        move(bike2);
    }, simulation_interval);
});
