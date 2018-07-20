import Component from '../ecs/component'
import RENDER_KEY from './render-key'

export default class RouteVisualiserComponent extends Component {
    constructor(route) {
        super();
        this.key = RENDER_KEY;
        this.route = route;
    }
}