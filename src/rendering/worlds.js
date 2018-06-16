import { render_vehicle } from './vehicles';

export function render_world(renderer, world) {
    for (const v of world.vehicles) {
        render_vehicle(renderer, v);
    } 
}

