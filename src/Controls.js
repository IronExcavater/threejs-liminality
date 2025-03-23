import * as THREE from 'three';
import { getKey, getKeys } from "./input.js";
import { PointerLockControls } from 'three/addons';

class Controls {
    constructor(object) {
        this.params = {
            walkSpeed: 1.5,
            sprintSpeed: 3,
            acceleration: 4,
        };

        this.velocity = new THREE.Vector3();

        this.lookControls = new PointerLockControls(object, document.body);
        this.lookControls.pointerSpeed = 0.5;
        this.lookControls.minPolarAngle = Math.PI / 5;
        this.lookControls.maxPolarAngle = 4 * Math.PI / 5;

        document.body.addEventListener('click', _ => {
            this.lookControls.lock();
        });
    }

    update(delta) {
        if (!this.lookControls.isLocked) return;

        const direction = new THREE.Vector3(
            getKey('KeyD') - getKey('KeyA'),
            0,
            getKey('KeyW') - getKey('KeyS')
        ).normalize();

        const isSprinting = getKeys(['ShiftLeft', 'ShiftRight']);

        const maxVelocity = new THREE.Vector3(
            direction.x * this.params.walkSpeed,
            0,
            direction.z * (isSprinting && direction.z > 0 ? this.params.sprintSpeed : this.params.walkSpeed)
        );

        this.velocity.lerp(maxVelocity, this.params.acceleration * delta);

        this.lookControls.moveRight(this.velocity.x * delta);
        this.lookControls.moveForward(this.velocity.z * delta);
    }
}

export default Controls;