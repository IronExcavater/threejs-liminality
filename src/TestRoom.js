import * as THREE from 'three';
import {BoxObject, ModelObject, PlaneObject} from './GameObject.js';
import {getMaterial, getModel} from './resources.js';
import {removeUpdatable} from "./app.js";

class TestRoom {
    constructor() {
        const floor = new PlaneObject({
            material: getMaterial('carpet'),
            scale: new THREE.Vector2(6, 6),
            position: new THREE.Vector3(0, -1, 0),
            rotation: new THREE.Euler(-Math.PI/2, 0, 0),
        });

        const ceiling = new PlaneObject({
            material: getMaterial('ceiling'),
            scale: new THREE.Vector2(6, 6),
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
                scale: new THREE.Vector3(6, 2, 0.1),
                material: getMaterial('wallpaper'),
                position: wallPositions[i],
                rotation: new THREE.Euler(0, Math.PI/2 * i, 0),
            });
        }

        const flashlight = new ModelObject({
            model: getModel('flashlight').scene,
            scale: new THREE.Vector3(0.5, 0.5, 0.5),
            position: new THREE.Vector3(0, -0.9, -2),
            interactRadius: 0.4,
            interactCallback: (player) => {
                if (player.hasFlashlight) return;
                player.hasFlashlight = true;

                const speed = 5;
                const threshold = 0.1;

                flashlight.update = (delta) => {
                    const direction = player.position.clone().sub(flashlight.position);
                    const velocity = direction.normalize().multiplyScalar(speed * delta);
                    flashlight

                    if (direction.length() < threshold) {
                        flashlight.removeFromParent();
                        removeUpdatable(flashlight);

                    }
                }
            },
        });
    }
}

export default TestRoom;