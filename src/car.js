import Point from './point';
import Wheel from './wheel';

import _ from 'lodash';

function normalise_angle(angle) {
    const min = -Math.PI; // Minimum allowed normalised value.
    const max = Math.PI; // Max allowed.

    // Many thanks: https://stackoverflow.com/questions/1628386
    const width = max - min;
    const offset = angle - min;
    return (offset - (Math.floor(offset / width) * width)) + min;
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

export default class Car {
    constructor(centre) {
        const wheel_opts = { width: 10, length: 30, angle: 0 };
        const length = 150;
        const width = 70;

        this.speed = 0;
        this.centre = centre;
        this.turn_limit = 1;
        this.body = {
            length, width
        };
        this.wheels = [
            new Wheel(new Point(length/2 - 17, 28), {...wheel_opts}), // front right
            new Wheel(new Point(-length/2 + 17, 28),{...wheel_opts}), // back right
            new Wheel(new Point(-length/2 + 17, -28), {...wheel_opts}), // back left
            new Wheel(new Point(length/2 - 17, -28), {...wheel_opts}),  // front left
        ];
    }

    turn(angle) {
        const new_angle = _.clamp(this.wheels[0].angle + angle, -this.turn_limit, this.turn_limit);
        this.wheels[0].angle = new_angle;
        this.wheels[3].angle = new_angle; 
    }

    turn_to(angle) {
        angle = _.clamp(normalise_angle(angle), -this.turn_limit, this.turn_limit);
        this.wheels[0].angle = angle;
        this.wheels[3].angle = angle; 
    }

    accelerate(speed_delta) {
        this.speed += speed_delta;
    }

    tick() {
        const { radius, point, clockwise } = this.get_turning_circle();
        const distance = this.speed;
        let angle_delta = distance / radius;
        angle_delta = clockwise ? angle_delta : -angle_delta;
     
        if (!point) {
            this.centre = this.centre.add(new Point(
                distance * Math.cos(this.angle),
                distance * Math.sin(this.angle)));
            return;
        }

        this.centre = this.centre.rot(angle_delta, point);
        this.angle = normalise_angle(this.angle + angle_delta);
    }

    get_turning_circle() {
        const max_turning_radius = 1e5;
        const centre = this.centre;
        const eqs = this.wheels.map(wheel => {
            const abs_centre = {
                x: centre.x + wheel.centre.x,
                y: centre.y + wheel.centre.y
            };
            const line_angle = wheel.angle + Math.PI/2;
            return eq_from_angle_and_point(line_angle, abs_centre); 
        });

        const int_point = calc_intersection_point(eqs[0], eqs[1])
        const first_wheel = this.wheels[0];
        const wheel_centre = centre.add(first_wheel.centre);
        const turning_radius = wheel_centre.distance_to(int_point);

        if (turning_radius > max_turning_radius) {
            return { radius: turning_radius, point: null };
        }    

        const rotated_int = int_point.rot(this.angle, centre);
        return {
            point: rotated_int,
            radius: turning_radius,
            clockwise: this.wheels[0].angle > 0
        }
    }
}

