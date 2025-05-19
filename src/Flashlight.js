import {ModelObject} from "./GameObject.js";
import {getModel} from "./resources.js";
import * as THREE from "three";
import {addUpdatable, world} from "./app.js";
import {Tween} from "./tween.js";

class Flashlight {
    constructor({
        scale = new THREE.Vector3.one,
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
    }) {
        this.object = new ModelObject({
            model: getModel('flashlight').scene,
            scale: scale,
            position: position,
            rotation: rotation,
            interactRadius: 0.4,
            interactCallback: this.onInteract.bind(this),
        });
    }

    onInteract(player) {
        if (player.hasFlashlight) return;
        player.hasFlashlight = true;

        console.log(this.object);

        world.removeBody(this.object.body);
        this.object.canInteract = false;

        new Tween({
            setter: position => this.object.position.copy(position),
            startValue: this.object.position.clone(),
            endValue: () => player.flashlight.position.clone(),
            duration: 1,
            onComplete: () => {
                this.object.update = () => {
                    this.object.position.copy(player.flashlight.position);
                    const targetPos = player.flashlight.target.getWorldPosition(new THREE.Vector3());
                    this.object.lookAt(targetPos);
                }
                addUpdatable(this.object);
            },
        });

        new Tween({
            setter: quaternion => this.object.quaternion.copy(quaternion),
            startValue: this.object.quaternion.clone(),
            endValue: () => {
                const euler = new THREE.Euler().setFromQuaternion(player.flashlight.quaternion);
                euler.y += Math.PI;
                return new THREE.Quaternion().setFromEuler(euler);
            },
            duration: 1,
        });
    }
}

export default Flashlight;