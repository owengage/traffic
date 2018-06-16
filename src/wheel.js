import _ from 'lodash';

export default class Wheel {
    constructor(centre, options={}) {
        const default_options = {
            width: 15,
            length: 30,
            angle: 0,
        };
        const o = _.merge({}, default_options, options);
        
        this.centre = centre;        
        this.width = o.width;
        this.length = o.length;
        this.angle = o.angle;
    }
}

