import * as THREE from 'three';
import {BoxObject, PlaneObject} from './Object.js';
import {getMaterial} from './resources.js';

class TestRoom {
    constructor() {

        const floor = new PlaneObject({
            material: getMaterial('carpet'),
            position: new THREE.Vector3(0, -1, 0),
            rotation: new THREE.Euler(-Math.PI/2, 0, 0),
        });

        const ceiling = new PlaneObject({
            material: getMaterial('ceiling'),
            position: new THREE.Vector3(0, 1, 0),
            rotation: new THREE.Euler(Math.PI/2, 0, 0),
        });

        const wallPositions = [
            new THREE.Vector3(0, 0, -3),
            new THREE.Vector3(3, 0, 0),
            new THREE.Vector3(0, 0, 3),
            new THREE.Vector3(-3, 0, 0),
        ]

        for (let i = 0; i < 4; i++) {
            const wall = new BoxObject({
                size: new THREE.Vector3(6, 2, 0.1),
                material: getMaterial('wallpaper'),
                position: wallPositions[i],
                rotation: new THREE.Euler(0, Math.PI/2 * i, 0),
            });
        }
    }
}

export default TestRoom;