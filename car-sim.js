function outline_canvas(ctx, canvas) {
    ctx.rect(1,1,canvas.width-2,canvas.height-2);
    ctx.stroke();
}

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

function make_bike(x, y) {
    const length = 70;
    const width = 20;
    return {
        centre: { x, y },
        angle: 0,
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
            wheel.length, 0);

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
    const poly = rectangle(centre, body.width, body.length, 0);
    const rotated = rotate_poly(poly, centre, vehicle.angle);

    trace_poly(ctx, rotated);
    ctx.stroke();
}

function render_guideline(ctx, from_point, to_point) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([3, 1]);
        ctx.moveTo(from_point.x, from_point.y);
        ctx.lineTo(to_point.x, to_point.y);
        ctx.strokeStyle = 'red';
        ctx.stroke();        
        ctx.restore();
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

function render_turning(ctx, vehicle) {
    const centre = vehicle.centre;
    const radius = 20;
    for (const wheel of vehicle.wheels) {
        const abs_centre = {
            x: centre.x + wheel.centre.x,
            y: centre.y + wheel.centre.y
        };

        const line_angle = Math.PI/2 - wheel.angle;
        const dx = radius * Math.sin(line_angle);
        const dy = radius * Math.cos(line_angle);

        const from_point= rotate_point({
            x: abs_centre.x - dx,
            y: abs_centre.y - dy, 
        }, centre, vehicle.angle);

        const to_point = rotate_point({
            x: abs_centre.x + 3*dx,
            y: abs_centre.y + 3*dy,
        }, centre, vehicle.angle);
        
        render_guideline(ctx, from_point, to_point);
    } 

    const eqs = vehicle.wheels.map(wheel => {
        const abs_centre = {
            x: centre.x + wheel.centre.x,
            y: centre.y + wheel.centre.y
        };
        const line_angle = Math.PI/2 - wheel.angle;
        return eq_from_angle_and_point(line_angle, abs_centre); 
    });

    const int_point = rotate_point(calc_intersection_point(eqs[0], eqs[1]), centre, vehicle.angle);
    ctx.fillRect(int_point.x, int_point.y, 5,5);
}

function render(ctx, vehicle) {
    render_wheels(ctx, vehicle);
    render_body(ctx, vehicle);
    render_turning(ctx, vehicle);
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('landscape');
    const ctx = canvas.getContext('2d');
    outline_canvas(ctx, canvas);

    const bike1 = make_bike(100, 400);
    bike1.angle = Math.PI * 1.4;
    render(ctx, bike1);

    const bike2 = make_bike(200, 200);
    render(ctx, bike2);

//    const bike3 = make_bike(300, 300);
//    bike3.wheels[0].angle = 0;
//    render(ctx, bike3);

    setTimeout(() => {
//        location.reload(true);
    }, 1000);
});
