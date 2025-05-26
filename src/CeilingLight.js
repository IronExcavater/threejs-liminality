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

        this.light = null;
        this.state = state;

        addUpdatable(this);
    }

    setState(state) {
        this.state = state;
    }

    update(delta) {
        if (this.position.distanceTo(player.object.position) < settings.maxNumLights * maze.config.cellSize) this.tryAddLight();
        else this.removeLight();

        if (this.light == null) return;

        this.light.intensity = 5;
    }

    tryAddLight() {
        if (this.state && !this.light) {
            this.light = ambientLighting.showCeilingLight(this.getWorldPosition(new THREE.Vector3()).sub(new THREE.Vector3(0, 0.5, 0)));
        }
    }

    removeLight() {
        if (this.light) {
            hideCeilingLight(this.light);
            this.light = null;
        }
    }

    dispose() {
        super.dispose();
        this.removeLight();
    }

    hide(hide) {
        super.hide(hide);
        if (this.hide) this.tryAddLight();
        else this.removeLight();
    }
}