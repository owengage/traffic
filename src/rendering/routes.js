import Polygon from 'traffic/polygon';
import { guideline } from './brushes';

export function render_route_segment(renderer, segment) {
    renderer.stroke_polygon(guideline, new Polygon([
        segment.start,
        segment.end
    ])) 

    renderer.stroke_arc(guideline, segment.end, 10);
    renderer.label(segment.start, "start");
    renderer.label(segment.end, "end");
}

