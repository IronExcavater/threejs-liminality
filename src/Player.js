import * as CANNON from 'cannon-es';
import {world, addUpdatable} from './app.js';
import Controls from './Controls.js';

class Player {
    constructor() {
        this.body = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Sphere(0.5),
            linearDamping: 0.99,
        });
        world.addBody(this.body);

        this.controls = new Controls(this.body);
        addUpdatable(this);
    }

    update(delta) {
        this.controls.update(delta);
    }
}

export default Player;