import System from '../ecs/system'
import RENDER_KEY from '../rendering/render-key'
import BRUSH_KEY from '../rendering/brush-key'

export default class RenderSystem extends System {
    constructor(renderer) { 
        super();
        this._renderer = renderer;
    }

    execute(entities) {
        for (const entity of entities) {
            const renderables = entity.components(RENDER_KEY);
            if (renderables.length === 0) continue;

            const transform = entity.get_overall_transform();
            const brush = entity.required_component(BRUSH_KEY);

            for (const comp of renderables) {
                this._renderer.fill_polygon(brush.brush, comp.polygon
                        .trans(transform.centre)
                        .rot(transform.rotation, transform.centre));
            }
        }
    }
}