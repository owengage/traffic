import Component from '../ecs/component'
import JOURNEY_KEY from './journey-key'

export default class LoopedJourneyComponent extends Component {
    constructor(route) {
        super();
        this.key = JOURNEY_KEY;
        this.route = route;
        this.token = 0;
    }
}