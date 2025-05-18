import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import {PointerLockControls} from 'three/addons';
import {world, addUpdatable, camera, scene, ids, renderer, debug, collisionFilters, audioListener,
    outlinePass} from './app.js';
import {getKey, getKeys} from './input.js';
import {getSound} from './resources.js';
import {GameObject} from './GameObject.js';

class Player {
    constructor({
        walkSpeed, runSpeed, jumpStrength, groundFriction,
        width, height,
        footstepInterval, cameraBob,
        interactionReach
    }) {
        this.contactNormal = new CANNON.Vec3();
        this.isGrounded = false;
        this.walkSpeed = walkSpeed;
        this.runSpeed = runSpeed;
        this.jumpStrength = jumpStrength;
        this.groundFriction = groundFriction;
        this.cameraOffset = height-width/2;

        this.footstepProgress = 0;
        this.footstepInterval = footstepInterval;
        this.cameraBob = cameraBob;

        this.raycaster = new THREE.Raycaster(undefined, undefined, 0.2, interactionReach);

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
        this.sound.setVolume(10);
        this.object.add(this.sound);

        this.lookControls = new PointerLockControls(this.object, renderer.domElement);
        this.lookControls.pointerSpeed = 0.5;
        this.lookControls.minPolarAngle = Math.PI / 5;
        this.lookControls.maxPolarAngle = 4 * Math.PI / 5;

        document.body.addEventListener('click', _ => {
            this.lookControls.lock();
        });


        this.hasFlashlight = false;
        this.flickerDuration = 0;
        this.flickerCooldown = 0;
        this.flashlightParams = {
            power: 20,
            powerUsage: 1,
            maxIntensity: 3,
            minIntensity: 0.8,
            maxFlicker: 0.2,
            minFlicker: 0.05,
            minCooldown: 0.05,
        };

        this.flashlight = new THREE.SpotLight(0xffffff, this.flashlightParams.maxIntensity, 6, Math.PI / 3, 1, 1);
        this.flashlight.visible = false;
        scene.add(this.flashlight);
        scene.add(this.flashlight.target);

        this.glowlight = new THREE.PointLight(0xffffff, 0.4, 10, 0.8);
        this.glowlight.position.sub(new THREE.Vector3(0, height * 0.7, 0));
        this.object.add(this.glowlight);

        addUpdatable(this);
    }

    update(delta) {
        const velocity = this.getVelocity();

        this.updateFootstep(velocity, delta);
        this.updateCamera();

        this.handleMovement(velocity, delta);

        this.handleInteraction();

        this.handleFlashlight(delta);
    }

    getVelocity() {
        // Get xz direction from input and normalise
        const isShifting = getKeys(['ShiftLeft', 'ShiftRight']);
        console.log(isShifting);

        const inputDirection = new THREE.Vector3(
            getKey('KeyD') - getKey('KeyA'),
            getKey('Space') - getKey('KeyC'),
            getKey('KeyS') - getKey('KeyW')
        ).normalize();

        // Get max velocity by multiply direction by speed depending on conditions
        const velocity = new THREE.Vector3(
            inputDirection.x * (isShifting ? this.runSpeed : this.walkSpeed),
            inputDirection.y * this.walkSpeed,
            inputDirection.z * (isShifting ? this.runSpeed : this.walkSpeed)
        );

        // Transform local to world space vector (remove yVel from impacting quaternion)
        const yVelocity = velocity.y;
        velocity.y = 0;
        velocity.applyQuaternion(this.object.quaternion);
        velocity.y = yVelocity;

        return velocity;
    }

    handleMovement(velocity, delta) {
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

    updateFootstep(velocity, delta) {
        if (!this.isGrounded) return;

        const xzVelocity = velocity.clone();
        xzVelocity.y = 0;

        const isWalking = xzVelocity.length() > 0.1;

        this.footstepProgress += xzVelocity.length() * delta;
        if (!isWalking && this.footstepProgress !== 0) this.footstepProgress += delta * 10;

        if (this.footstepProgress >= this.footstepInterval) {
            this.sound.setBuffer(getSound('step'));
            this.sound.play();
            this.footstepProgress = 0;
        }
    }

    updateCamera() {
        const bobOffset = Math.sin(this.footstepProgress / this.footstepInterval * Math.PI) * this.cameraBob;

        this.object.position.copy(this.body.position.toThree().add(new THREE.Vector3(0, this.cameraOffset + bobOffset, 0)));
    }

    handleInteraction() {
        this.raycaster.set(this.object.position, camera.getWorldDirection(THREE.Vector3.zero));

        const intersects = this.raycaster.intersectObjects(scene.children);

        outlinePass.selectedObjects = [];
        for (const intersect of intersects) {
            const object = intersect.object;
            if (object instanceof GameObject && object.canInteract) {
                if (getKey('KeyE', true)) object.interact(this);
                outlinePass.selectedObjects.push(object);
                break;
            }
        }
    }

    handleFlashlight(delta) {
        if (!this.hasFlashlight) return;

        if (getKey('KeyF', true)) {
            this.flashlight.visible = !this.flashlight.visible;
        }

        this.flashlight.position.copy(this.object.localToWorld(new THREE.Vector3(0.3, -0.3, -0.2)));
        this.flashlight.rotation.copy(this.object.rotation);

        const targetOffset = this.object.getWorldDirection(THREE.Vector3.zero).negate().multiplyScalar(2);
        this.flashlight.target.position.lerp(this.object.position.clone().add(targetOffset), 0.1);

        if (!this.flashlight.visible) return;

        this.flashlightParams.power = Math.max(this.flashlightParams.power - delta * this.flashlightParams.powerUsage, 0);

        if (this.flashlightParams.power < 15) {
            const intensity = THREE.MathUtils.lerp(this.flashlightParams.minIntensity, this.flashlightParams.maxIntensity, this.flashlightParams.power / 15);

            const flickerChance = 0.2 + 0.8 * intensity;
            if (this.flickerCooldown <= 0 && Math.random() < flickerChance) {
                const random = (1 + Math.random()) * 0.5;
                this.flickerDuration = THREE.MathUtils.lerp(this.flashlightParams.minFlicker, this.flashlightParams.maxFlicker, intensity) + random;
                this.flickerCooldown = this.flickerDuration + this.flashlightParams.minCooldown + intensity * random;
            }
            this.flickerDuration -= delta;
            this.flickerCooldown -= delta;
            this.flashlight.intensity = this.flickerDuration > 0 ? 0.01 : intensity;
        } else {
            this.flashlight.intensity = this.flashlightParams.maxIntensity;
        }
    }

    setPosition(vector3) {
        this.body.position.copy(vector3.toCannon());
        this.object.position.copy(vector3);
        this.updateCamera();
    }

    setRotation(vector3) {
        this.object.rotation.copy(vector3);
        this.body.quaternion.copy(new CANNON.Quaternion().setFromEuler(
            vector3.x,
            vector3.y,
            vector3.z
        ));
    }
}

export default Player;