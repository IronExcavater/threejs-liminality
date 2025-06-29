import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getFurniture} from './resources.js';
import {addUpdatable, maze, player, settings} from './app.js';

export default class Furniture extends ModelObject {
    constructor({
        cell,
        modelName = 'chair_031',
        scale = new THREE.Vector3(1, 1, 1),
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
    }) {
        super({
            model: getFurniture('furniture', modelName),
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


    /**
     * models in furniture gltf
     *  chair_031 -- make default model.
        chair_030
        table_016
        bookCaseV2_004
        bookCaseV2_005
        bookCaseV2_006
     */
}