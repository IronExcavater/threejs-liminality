import {ModelObject} from "./GameObject.js";
import {getModel} from "./resources.js";
import * as THREE from "three";
import {addUpdatable, world} from "./app.js";
import {Tween} from "./tween.js";

class Flashlight extends ModelObject {
    constructor({
        scale = new THREE.Vector3.one,
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
    }) {
        super({
            model: getModel('flashlight').scene,
            scale: scale,
            position: position,
            rotation: rotation,
            interactRadius: 0.4,
        });

        this.interactCallback = this.onInteract.bind(this);
        this.canInteract = true;
    }

    onInteract(player) {
        if (player.hasFlashlight) return;
        player.hasFlashlight = true;

        world.removeBody(this.body);
        this.canInteract = false;

        new Tween({
            setter: position => this.position.copy(position),
            startValue: this.position.clone(),
            endValue: () => player.flashlight.position.clone(),
            duration: 1,
            onComplete: () => {
                this.update = () => {
                    this.position.copy(player.flashlight.position);
                    const targetPos = player.flashlight.target.getWorldPosition(new THREE.Vector3());
                    this.lookAt(targetPos);
                }
                addUpdatable(this);
            },
        });

        new Tween({
            setter: quaternion => this.quaternion.copy(quaternion),
            startValue: this.quaternion.clone(),
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