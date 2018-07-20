import Component from '../ecs/component';
import WHEEL_KEY from './wheel-key';

export const WheelKind = {
    STATIC: 'fixed',
    FOLLOW: 'follow',
};

export default class WheelComponent extends Component {
    
    constructor(kind) {
        super();
        if (!kind) throw new Error('Must provide kind for wheel');
        this.key = WHEEL_KEY;
        this.kind = kind;
    }
}
