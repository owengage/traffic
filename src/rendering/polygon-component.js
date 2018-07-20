import Component from '../ecs/component';
import RENDER_KEY from './render-key';

export default class PolygonComponent extends Component {
    constructor(polygon) {
        super();
        this.key = RENDER_KEY;
        this.polygon = polygon;
    }

}
