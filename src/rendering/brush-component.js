import Component from '../ecs/component';
import BRUSH_KEY from './brush-key';

export default class BrushComponent extends Component {
    constructor(brush) {
        super();
        this.key = BRUSH_KEY;
        this.brush = brush;
    }
}