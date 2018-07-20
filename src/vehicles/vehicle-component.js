import Component from '../ecs/component';
import VEHICLE_KEY from './vehicle-key';
import Point from '../point';

export default class VehicleComponent extends Component {
    constructor(turn_point, anchor_point) {
        super();
        if (!(turn_point instanceof Point && anchor_point instanceof Point)) {
            throw new Error('turn_point and anchor_point need to be Points');
        }

        this.key = VEHICLE_KEY;
        this.turn_angle = 0;
        this.turn_point = turn_point;
        this.anchor_point = anchor_point;
        this.speed = 5;
    }
}
