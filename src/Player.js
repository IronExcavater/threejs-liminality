import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import {PointerLockControls} from 'three/addons';
import {world, addUpdatable, camera, scene} from './app.js';
import {getKey, getKeys} from "./input.js";

class Player {
    constructor() {
        this.params = {
            speed: 10,
            jump: 4,
            friction: 4,
            offset: new THREE.Vector3(0, 0.7, 0),
        };

        this.contactNormal = new CANNON.Vec3();
        this.isGrounded = false;
        this.body = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Sphere(0.5),
            position: new CANNON.Vec3(0, -0.5, 0),
        });
        world.addBody(this.body);

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

        this.flashlight = new THREE.SpotLight(0xffffff, 1, 6, Math.PI / 3, 1, 2);
        scene.add(this.flashlight);
        scene.add(this.flashlight.target);

        addUpdatable(this);
    }

    update(delta) {
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

        if (getKey('KeyF', true)) {
            this.flashlight.visible = !this.flashlight.visible;
        }

        this.flashlight.position.copy(this.object.position);
        this.flashlight.target.position.lerp(this.object.position.clone().add(this.object.getWorldDirection(THREE.Vector3.zero).negate().multiplyScalar(2)), 0.1);
        this.flashlight.rotation.copy(this.object.rotation);
    }
}

export default Player;