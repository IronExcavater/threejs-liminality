import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getModel, getSound} from './resources.js';
import {addUpdatable, ambientSound, audioListener, ids, player, scene} from './app.js';
import {randomRange} from "./utils.js";
import {fadeIn, fadeOut} from './transition.js';

class WeepingAngel extends ModelObject {
    constructor({
        scale = new THREE.Vector3(1.5, 1.5, 1.5),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        teleportRadiusRange = [10, 20],
        moveSpeed = 500,
    }) {
        super({
            model: getModel('weepingAngel'),
            scale,
            position,
            rotation,
            shapeType: 'cylinder',
            mass: 1000,
        });

        this.state = 'inactive';
        this.isMoving = false;
        this.hasMoved = false;
        this.poses = {
            far: this.mesh.getObjectByName('angel-far'),
            mid: this.mesh.getObjectByName('angel-mid'),
            close: this.mesh.getObjectByName('angel-close'),
        }

        this.sound = new THREE.PositionalAudio(audioListener);
        this.sound.setRefDistance(5);
        this.sound.setVolume(1);
        this.add(this.sound);

        this._meshes = [];
        this.traverse(obj => {
            if (obj.isMesh) this._meshes.push(obj);
        });

        this.setPose('far');

        this.teleportRadiusRange = teleportRadiusRange;
        this.moveSpeed = moveSpeed;
        this.velocity = new THREE.Vector3();
        this._raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 20);

        this.teleportNearby();

        this.body.addEventListener('collide', (e) => {
            const other = e.body;

            if (other.id === ids.get('Player') && this.isMoving) {
                console.log("Weeping Angel collided with player. Teleporting player...");
                ambientSound.playGlobalSound('riser');
                fadeIn({
                    onComplete: () => {
                        player.setPosition(new THREE.Vector3(0, 0, 0));
                        player.setRotation(new THREE.Vector3());
                        this.teleportNearby();
                        fadeOut({});
                    }
                });
            }
        });

        addUpdatable(this);
    }

    update(delta) {
        //console.log('isOccluded():', this.isOccluded(), 'isSeenByPlayer():', this.isSeenByPlayer());
        const distance = this.position.distanceTo(player.object.position);

        this.body.velocity.copy(this.velocity.toCannon());
        this.position.copy(this.body.position.toThree());
        this.isMoving = false;

        switch (this.state) {
            case 'inactive':
                this.velocity = new THREE.Vector3();
                if (!this.isOccluded() && this.isSeenByPlayer() && distance < 10) {
                    console.log("Angel ready!");
                    this.state = 'ready';
                }
                break;
            case 'ready':
                if (!this.isOccluded() && !this.isSeenByPlayer()) {
                    console.log("Angel active!");
                    this.state = 'active';

                    if (distance > 6) this.setPose('mid');
                    else this.setPose('close');
                }
                break;
            case 'active':
                if (this.isOccluded() || !this.isSeenByPlayer()) {
                    this.velocity = this.moveTowardsPlayer(delta);
                    this.isMoving = true;
                    this.hasMoved = true;

                    if (distance > 6) this.setPose('mid');
                    else this.setPose('close');
                }
                else {
                    this.velocity = new THREE.Vector3();
                    if (this.hasMoved) {
                        this.sound.setBuffer(getSound('weepingAngel'));
                        this.sound.play();
                        this.hasMoved = false;
                    }
                }
                break;
        }

        if (distance > this.teleportRadiusRange[1] + 10) {
            console.log("Angel is too far. Teleporting...");
            this.teleportNearby();
        }
    }

    isOccluded() {
        const toAngel = new THREE.Vector3().subVectors(this.position, player.object.position).normalize();
        this._raycaster.set(player.object.position, toAngel);
        const intersects = this._raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            return this !== obj && !this._meshes.includes(obj);
        }

        return false; // no hit = not occluded
    }

    isSeenByPlayer() {
        const toAngel = new THREE.Vector3().subVectors(this.position, player.object.position).normalize();
        const forward = player.object.getWorldDirection(new THREE.Vector3()).negate();

        const dot = toAngel.dot(forward); // dot close to 1 means looking at weeping angel
        return dot >= 0;
    }

    teleportNearby() {
        const angle = Math.random() * Math.PI * 2;
        const radius = randomRange(this.teleportRadiusRange[0], this.teleportRadiusRange[1]);
        const dx = Math.cos(angle) * radius;
        const dz = Math.sin(angle) * radius;

        this.position.set(
            player.object.position.x + dx,
            this.position.y,
            player.object.position.z + dz
        );
        console.log(`Angel teleported to: (${this.position.x},${this.position.z})`);

        this.state = 'inactive';
        this.setPose('far');
        this.rotation.set(0, randomRange(0, 359, 0), 0);
    }

    moveTowardsPlayer(delta) {
        console.log("Angel is moving toward player.");
        const step = this.moveSpeed * delta;
        const direction = new THREE.Vector3().subVectors(player.object.position, this.position);
        direction.y = 0;
        direction.normalize();

        const angle = Math.atan2(-direction.x, -direction.z);
        this.rotation.set(0, angle, 0);

        direction.multiplyScalar(step);
        return direction;
    }

    setPose(poseName) {
        for (const key in this.poses) {
            this.poses[key].visible = (key === poseName);
        }
    }
}

export default WeepingAngel;