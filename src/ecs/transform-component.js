import TRANSFORM_KEY from './transform-key';
import Component from './component';
import Point from '../point';

export default class TransformComponent extends Component {
    constructor(centre, rotation) {
        super()
        this.key = TRANSFORM_KEY;
        this.centre = centre;
        this.rotation = rotation;
    }

    /**
     * Apply a transformation to the current transformation, returning the combination.
     * This does not modify the current transform.
     * 
     * @param {TransformComponent} transform 
     */
    apply(transform) {
        const centre = this.centre.add(transform.centre.rot(this.rotation, new Point(0,0)));   
        const rotation = this.rotation + transform.rotation;
        return new TransformComponent(centre, rotation);
        
    }
}