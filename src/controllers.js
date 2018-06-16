import Point from './point';

const key_left = 37;
const key_right = 39;
const key_up = 38;
const key_down = 40;

export function attach_view_controller(renderer) {
    function on_keypress(event) {
        switch (event.keyCode) {
            case key_left:
                renderer.centre = renderer.centre.add(new Point(-100, 0));
                break;
            case key_right:
                renderer.centre = renderer.centre.add(new Point(100, 0));
                break; 
            case key_up:
                renderer.centre = renderer.centre.add(new Point(0, -100));
                break;
            case key_down:
                renderer.centre = renderer.centre.add(new Point(0, 100));
                break;
            case 0:
                if (event.key == '+') renderer.scale *= 1.1;
                if (event.key == '=') renderer.scale *= 1.1;
                if (event.key == '-') renderer.scale *= 1/1.1;
                if (event.key == 'd') console.log(renderer);
                break;
        }
    }
    document.addEventListener('keypress', on_keypress);
}

export function attach_controller(vehicle) {
    function on_keypress(event) {
        switch (event.keyCode) {
            case key_left:
                vehicle.turn(-0.1);
                break;
            case key_right:
                vehicle.turn(0.1);
                break; 
            case key_up:
                vehicle.accelerate(1);
                break;
            case key_down:
                vehicle.accelerate(-1);
                break;
            case 0:
                if (event.key == 'd') console.debug('Debug print', vehicle);
                break;
        }
    }
    document.addEventListener('keypress', on_keypress);
}

export function attach_debug_controls(simulate_fn) {
    function on_keypress(event) {
        switch (event.keyCode) {
            case 0:
                if (event.key == 's') simulate_fn();
                break;
        }
    }
    document.addEventListener('keypress', on_keypress);
}

