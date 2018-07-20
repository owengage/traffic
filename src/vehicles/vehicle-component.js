import Component from '../ecs/component';
import VEHICLE_KEY from './vehicle-key';
import Point from '../point';

export default class VehicleComponent extends Component {
    constructor(turn_point, anchor_point, routing_point) {
        super();
        if (!(turn_point instanceof Point 
                && anchor_point instanceof Point
                && routing_point instanceof Point)) {
            throw new Error('turn_point, anchor_point, and routing_point need to be Points');
        }

        this.key = VEHICLE_KEY;
        this.routing_point = routing_point;                                                                                                                                                                                                                                                                                                                                                                        
        this._turn_angle = 0;
        this.turn_point = turn_point;
        this.anchor_point = anchor_point;
        this.speed = 20;
    }

    get turn_angle() {
        return this._turn_angle;
    }

    set turn_angle(value) {
        const max_turn = 0.9;
        this._turn_angle = _.clamp(value, -max_turn, max_turn);
    }
}
