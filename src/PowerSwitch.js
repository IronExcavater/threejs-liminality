import * as THREE from "three";
import {ModelObject} from "./GameObject.js";
import {getModel} from "./resources.js";
import {addUpdatable} from "./app.js";

class PowerSwitch extends ModelObject {
    constructor({
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
        state = false,
    }) {
        super({
            model: getModel('powerSwitch').scene,
            scale: new THREE.Vector3(1, 1, 1),
            position: position,
            rotation: rotation,
            interactRadius: 0.4,
        });

        this.state = state;
        this.interactCallback = this.onInteract.bind(this);
        this.canInteract = true;

        addUpdatable(this);
    }

    onInteract(player) {
        console.log('interacted with power switch');
    }

    update() {

    }
}

export default PowerSwitch;