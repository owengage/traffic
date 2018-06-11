export default class Polygon {
    constructor(points) {
        this.points = points;
    }
    
    rot(angle, centre) {
        return new Polygon(this.points.map(point => point.rot(angle, centre)));
    }

    trans(point) {
        return new Polygon(this.points.map(p => p.add(point)));
    }

    scalar_mult(scale) {
        return new Polygon(this.points.map(p => p.scalar_mult(scale)));
    }
}

