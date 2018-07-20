import Component from '../ecs/component'
import RENDER_KEY from './render-key'

export default class GridComponent extends Component {
    constructor(width, colour) {
        super();
        this.key = RENDER_KEY;
        this.width = width;
        this.colour = colour;
    }
}