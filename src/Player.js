import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import {PointerLockControls} from 'three/addons';
import {world, addUpdatable, camera, scene, ids, renderer, debug, collisionFilters, audioListener} from './app.js';
import {getKey, getKeys} from "./input.js";
import {getSound} from "./resources.js";

class Player {
    constructor({
        walkSpeed, jumpStrength, groundFriction,
        width, height,
        footstepInterval, cameraBob
    }) {
        this.contactNormal = new CANNON.Vec3();
        this.isGrounded = false;
        this.walkSpeed = walkSpeed;
        this.jumpStrength = jumpStrength;
        this.groundFriction = groundFriction;
        this.cameraOffset = height-width/2;

        this.footstepProgress = 0;
        this.footstepInterval = footstepInterval;
        this.cameraBob = cameraBob;

        this.contactNormal = new CANNON.Vec3();
        this.isGrounded = false;
        this.body = new CANNON.Body({
            mass: 5,
            position: new CANNON.Vec3(0, 0, 0),
            fixedRotation: true,
            collisionFilterGroup: collisionFilters.get('Player'),
            collisionFilterMask: collisionFilters.get('World'),
        });
        this.body.id = ids.get('Player');

        const cylinder = new CANNON.Cylinder(width/2, width/2, height-width);
        const topSphere = new CANNON.Sphere(width/2);
        const bottomSphere = new CANNON.Sphere(width/2);

        this.body.addShape(cylinder, new CANNON.Vec3(0, width+(height-width*2)/2, 0));
        this.body.addShape(topSphere, new CANNON.Vec3(0, this.cameraOffset, 0));
        this.body.addShape(bottomSphere, new CANNON.Vec3(0, width/2, 0));
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

        this.sound = new THREE.PositionalAudio(audioListener);
        this.sound.setRefDistance(10);
        this.object.add(this.sound);

        this.lookControls = new PointerLockControls(this.object, renderer.domElement);
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
        const velocity = this.getVelocity();

        const xzVelocity = velocity;
        xzVelocity.y = 0;

        this.updateFootstep(xzVelocity, delta);
        this.updateCameraBob();

        this.applyMovement(velocity, delta);

        this.updateFlashlight();
    }

    getVelocity() {
        // Get xz direction from input and normalise
        const isShifting = getKeys(['ShiftLeft', 'ShiftRight']);

        const inputDirection = new THREE.Vector3(
            getKey('KeyD') - getKey('KeyA'),
            getKey('Space') - isShifting,
            getKey('KeyS') - getKey('KeyW')
        ).normalize();

        // Get max velocity by multiply direction by speed depending on conditions
        const velocity = new THREE.Vector3(
            inputDirection.x * this.walkSpeed * 0.8,
            inputDirection.y * this.walkSpeed,
            inputDirection.z * this.walkSpeed * (inputDirection.z < 0 ? (isShifting ? 1.5 : 1) : 0.5)
        );

        // Transform local to world space vector (remove yVel from impacting quaternion)
        const yVelocity = velocity.y;
        velocity.y = 0;
        velocity.applyQuaternion(this.object.quaternion);
        velocity.y = yVelocity;

        return velocity;
    }

    applyMovement(velocity, delta) {
        if (debug.noclip) {
            this.body.velocity.x += velocity.x * 4 * delta;
            this.body.velocity.y += velocity.y * 4 * delta;
            this.body.velocity.z += velocity.z * 4 * delta;

            this.body.velocity.lerp(CANNON.Vec3.zero, this.groundFriction * delta, this.body.velocity);

        } else {
            if (this.isGrounded) {
                this.body.velocity.x += velocity.x * delta;
                this.body.velocity.z += velocity.z * delta;

                this.body.velocity.lerp(CANNON.Vec3.zero, this.groundFriction * delta, this.body.velocity);

                if (getKey('Space')) {
                    this.body.velocity.y = this.jumpStrength;
                    this.isGrounded = false;
                }
            }
        }
    }

    updateFootstep(xzVelocity, delta) {
        if (!this.isGrounded) return;

        const isWalking = xzVelocity.length() > 0.1;

        this.footstepProgress += xzVelocity.length() * delta;
        if (!isWalking && this.footstepProgress !== 0) this.footstepProgress += delta * 10;

        if (this.footstepProgress >= this.footstepInterval) {
            this.sound.setBuffer(getSound('step'));
            this.sound.play();
            this.footstepProgress = 0;
        }
    }

    updateCameraBob() {
        const bobOffset = Math.sin(this.footstepProgress / this.footstepInterval * Math.PI) * this.cameraBob;

        this.object.position.copy(this.body.position.toThree().add(new THREE.Vector3(0, this.cameraOffset + bobOffset, 0)));
    }

    updateFlashlight() {
        if (getKey('KeyF', true)) {
            this.flashlight.visible = !this.flashlight.visible;
        }

        this.flashlight.position.copy(this.object.position);
        this.flashlight.rotation.copy(this.object.rotation);

        const targetOffset = this.object.getWorldDirection(THREE.Vector3.zero).negate().multiplyScalar(2);
        this.flashlight.target.position.lerp(this.object.position.clone().add(targetOffset), 0.1);
    }
}

export default Player;