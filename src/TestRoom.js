import * as THREE from 'three';
import {BoxObject, ModelObject, PlaneObject} from './GameObject.js';
import {getMaterial, getModel} from './resources.js';
import {addUpdatable, world} from './app.js';
import {Tween} from './tween.js';

class TestRoom {
    constructor() {
        const flashlight = new ModelObject({
            model: getModel('flashlight').scene,
            scale: new THREE.Vector3(0.5, 0.5, 0.5),
            position: new THREE.Vector3(0, -0.9, -2),
            interactRadius: 0.4,
            interactCallback: (player) => {
                if (player.hasFlashlight) return;
                player.hasFlashlight = true;

                world.removeBody(flashlight.body);
                flashlight.canInteract = false;

                new Tween({
                    setter: position => flashlight.position.copy(position),
                    startValue: flashlight.position.clone(),
                    endValue: () => player.flashlight.position.clone(),
                    duration: 1,
                    onComplete: () => {
                        flashlight.update = () => {
                            flashlight.position.copy(player.flashlight.position);
                            const targetPos = player.flashlight.target.getWorldPosition(new THREE.Vector3());
                            flashlight.lookAt(targetPos);
                        }
                        addUpdatable(flashlight);
                    },
                });

                new Tween({
                    setter: quaternion => flashlight.quaternion.copy(quaternion),
                    startValue: flashlight.quaternion.clone(),
                    endValue: () => {
                        const euler = new THREE.Euler().setFromQuaternion(player.flashlight.quaternion);
                        euler.y += Math.PI;
                        return new THREE.Quaternion().setFromEuler(euler);
                    },
                    duration: 1,
                });
            },
        });
    }
}

export default TestRoom;