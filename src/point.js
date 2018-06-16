export default class Point {
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

    scalar_mult(scale) {
        return new Point(this.x * scale, this.y * scale);
    }

    negate() {
        return new Point(-this.x, -this.y);
    }

    distance_to(p) {
        const d = this.sub(p);
        return Math.sqrt(d.x * d.x + d.y * d.y);
    }
}
