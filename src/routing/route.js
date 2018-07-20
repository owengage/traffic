import RouteSegment from './route-segment';

function segmentise(points) {
    const segments = [];

    for (let i = 0; i < points.length - 1; i++) {
        segments.push(new RouteSegment(points[i], points[i+1]));
    }
    segments.push(new RouteSegment(points[points.length - 1], points[0]));

    return segments;
}

export default class Route {
    constructor(points) {
        this.segments = segmentise(points);
    }
}
