import Point from './point';

export default class Polygon {
    constructor(points) {
        this.points = points;
    }
    
    rot(angle, centre) {
        if (!centre) throw new Error('Must provide centre of rotation');
        return new Polygon(this.points.map(point => point.rot(angle, centre)));
    }

    trans(point) {
        return new Polygon(this.points.map(p => p.add(point)));
    }

    scalar_mult(scale) {
        return new Polygon(this.points.map(p => p.scalar_mult(scale)));
    }
}

/**
 * Make rectangle at angle '0', so lying on its side.
 */
export function make_rectangle(centre, width, length) {
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
