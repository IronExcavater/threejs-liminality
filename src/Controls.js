import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {PointerLockControls} from 'three/addons';
import {camera, scene} from "./app.js";
import {getKey, getKeys} from './input.js';
import './utils.js';

class Controls {
    constructor(body) {
        this.params = {
            speed: 10,
            jump: 4,
            friction: 4,
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

        this.contactNormal = new CANNON.Vec3();

        this.body.addEventListener('collide', (e) => {
            const { contact } = e;

            if (contact.bi.id === this.body.id) { // Body is bi
                contact.ni.negate(this.contactNormal); // Set contactNormal to inverse of contact
            } else { // Body is bj
                this.contactNormal.copy(contact.ni); // Set contactNormal to contact
            }

            if (this.contactNormal.dot(CANNON.Vec3.up) > 0.9) {
                this.isGrounded = true;
            }
        });
    }

    update(delta) {
        if (!this.lookControls.isLocked) return;

        if (this.isGrounded) {
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

            velocity.applyQuaternion(this.object.quaternion);

            this.body.velocity.x += velocity.x * delta;
            this.body.velocity.z += velocity.z * delta;

            this.body.velocity.lerp(CANNON.Vec3.zero, this.params.friction * delta, this.body.velocity);

            if (getKey('Space')) {
                this.body.velocity.y = this.params.jump;
                this.isGrounded = false;
            }
        }

        this.object.position.copy(this.body.position.toThree().add(this.params.offset));
    }
}

export default Controls;