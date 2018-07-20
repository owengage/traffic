import System from '../ecs/system'
import RENDER_KEY from './render-key'
import BRUSH_KEY from './brush-key'
import GridComponent from './grid-component'
import RouteVisualiserComponent from './route-visualiser-component'
import { line_colour } from './brushes'
import { render_route_segment } from './routes'

export default class RenderSystem extends System {
    constructor(renderer) { 
        super();
        this._renderer = renderer;
    }

    execute(entities) {
        this._renderer.clear();

        for (const entity of entities) {
            const renderables = entity.components(RENDER_KEY);
            if (renderables.length === 0) continue;

            const transform = entity.get_overall_transform();
            const brush = entity.optional_component(BRUSH_KEY);

            for (const comp of renderables) {
                if (comp instanceof GridComponent) {
                    this._renderer.grid(line_colour('#eee'), comp.width);
                } else if (comp instanceof RouteVisualiserComponent) {
                    comp.route.segments.forEach(s => render_route_segment(this._renderer, s));
                } else {
                    this._renderer.fill_polygon(brush.brush, comp.polygon
                        .trans(transform.centre)
                        .rot(transform.rotation, transform.centre));
                }
            }
        }
    }
}