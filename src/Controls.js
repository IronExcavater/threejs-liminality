import * as THREE from 'three';
import {PointerLockControls} from 'three/addons';
import {camera, scene} from "./app.js";
import {getKey, getKeys} from './input.js';
import './utils.js';

class Controls {
    constructor(body) {
        this.params = {
            speed: 8,
            offset: new THREE.Vector3(0, 0.5, 0),
        };

        this.body = body;
        this.object = new THREE.Object3D();
        this.object.add(camera);
        scene.add(this.object);

        this.lookControls = new PointerLockControls(this.object, document.body);
        this.lookControls.pointerSpeed = 0.5;
        this.lookControls.minPolarAngle = Math.PI / 5;
        this.lookControls.maxPolarAngle = 4 * Math.PI / 5;

        document.body.addEventListener('click', _ => {
            this.lookControls.lock();
        });
    }

    update(delta) {
        if (!this.lookControls.isLocked) return;

        // Get xz direction from input and normalise
        const inputDirection = new THREE.Vector3(
            getKey('KeyD') - getKey('KeyA'),
            0,
            getKey('KeyS') - getKey('KeyW')
        ).normalize();

        // Get max velocity by multiply direction by speed depending on conditions
        const isSprinting = getKeys(['ShiftLeft', 'ShiftRight']);
        const velocity = new THREE.Vector3(
            inputDirection.x * this.params.speed * 0.8,
            0,
            inputDirection.z * this.params.speed * (inputDirection.z < 0 ? (isSprinting ? 1.5 : 1) : 0.5)
        );

        //const euler = new THREE.Euler(0, this.object.quaternion.y, 0, 'XYZ');
        const quat = new THREE.Quaternion(this.object.quaternion);
        velocity.applyQuaternion(this.object.quaternion);

        this.body.velocity.x += velocity.x * delta;
        this.body.velocity.z += velocity.z * delta;

        this.object.position.copy(this.body.position.toThree().add(this.params.offset));
    }
}

export default Controls;