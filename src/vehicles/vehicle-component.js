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
        // TODO: Set routing point properly.
        this.routing_point = routing_point;                                                                                                                                                                                                                                                                                                                                                                        
        this.turn_angle = 0;
        this.turn_point = turn_point;
        this.anchor_point = anchor_point;
        this.speed = 5;
    }
}
