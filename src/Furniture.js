import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getModel} from './resources.js';

export default class Furniture extends ModelObject {
    constructor({
        cell,
        scale = new THREE.Vector3(1, 1, 1),
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
    }) {
        super({
            model: getModel('furniture'),
            scale: scale,
            position: position,
            rotation: rotation,
            interactRadius: 0.5,
        });

        this.cell = cell;
        this.interactCallback = this.onInteract.bind(this);
        this.canInteract = true;
    }

    onInteract(player) {
        console.log("Interacted with furniture at cell:", this.cell);
    }
}