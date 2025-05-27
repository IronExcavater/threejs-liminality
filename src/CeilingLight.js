import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getModel} from './resources.js';
import {addUpdatable, ambientLighting, maze, player, settings} from './app.js';

export default class CeilingLight extends ModelObject {
    constructor({
        cell,
        scale = new THREE.Vector3(1, 1, 1),
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
        state = false,
    }) {
        super({
            model: getModel('ceilingLight'),
            scale: scale,
            position: position,
            rotation: rotation
        });

        this.cell = cell;
        this.state = state;
        this.light = null;

        addUpdatable(this);
    }

    setState(state) {
        this.state = state;
    }

    lightPosition() {
        return this.getWorldPosition(new THREE.Vector3()).sub(new THREE.Vector3(0, 0.5, 0));
    }

    update(delta) {
        if (!this.culled && this.state) this.tryAddLight();
        else this.removeLight();
    }

    tryAddLight() {
        if (this.light === null) this.light = ambientLighting.showCeilingLight(this.lightPosition());
    }

    removeLight() {
        if (this.light !== null) {
            ambientLighting.hideCeilingLight(this.light);
            this.light = null;
        }
    }

    dispose() {
        super.dispose();
        this.removeLight();
    }
}