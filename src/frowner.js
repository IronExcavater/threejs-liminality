import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getModel, getSound} from './resources.js';
import {addUpdatable, ambientSound, audioListener, ids, player, scene} from './app.js';
import {randomRange} from './utils.js';
import {Tween} from './tween.js';


export default class frowner extends ModelObject {
    constructor({
        scale = new THREE.Vector3(1, 1, 1),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        teleportRadiusRange = [10, 20],
        moveSpeed = 150,
    }) {
        super ({
            model: getModel ('frownMask'),
            scale,
            position,
            rotation,
            shapeType: 'cylinder', 
            mass: 500,
        });

        this.isMoving = false;
        this.hasMoved = false;
        this.attached = false;

        this._meshes = [];
        this.traverse(obj => {
            if (obj.isMesh) this._meshes.push(obj);
        });

        this.teleportRadiusRange = teleportRadiusRange;
        this.moveSpeed = moveSpeed;
        this.velocity = new THREE.Vector3();
        this._raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 20);
        
        this.teleportNearby();

        this.body.addEventListener('collide', (e) => {
                    const other = e.body;
        
                    if (other.id === ids.get('Player') && this.isMoving && this.attached == false) {
                        console.log("Da frowner has latched onto you uh oh spaghettio");
                        ambientSound.playGlobalSound('riser');
                        this.attached = true;
                        new Tween({
                                    setter: quaternion => this.quaternion.copy(quaternion),
                                    startValue: this.quaternion.clone(),
                                    endValue: () => {
                                        const euler = new THREE.Euler().setFromQuaternion(player.object.quaternion);
                                        euler.y += Math.PI;
                                        return new THREE.Quaternion().setFromEuler(euler);
                                    },
                                    duration: 0.01,
                                });
                        other.position = player.object.localToWorld(new THREE.Vector3(0, 0, 0));
                        //adjust to ideally cover the players face   
                    }
            });

        addUpdatable(this);
    }

    isOccluded() {
        const toAngel = new THREE.Vector3().subVectors(this.position, player.object.position).normalize();
        this._raycaster.set(player.object.position, toAngel);
        const intersects = this._raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            return this !== obj && !this._meshes.includes(obj);
        }
            return false;
    }
    
    isSeenByPlayer() {
        const toAngel = new THREE.Vector3().subVectors(this.position, player.object.position).normalize();
        const forward = player.object.getWorldDirection(new THREE.Vector3()).negate();
        const dot = toAngel.dot(forward); 
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
        console.log(`Frowner teleported to: (${this.position.x},${this.position.z})`);
        this.rotation.set(0, randomRange(0, 359, 0), 0);
    }
    
    moveTowardsPlayer(delta) {
        console.log("Da frowner is moving toward player.");
        const step = this.moveSpeed * delta;
        const direction = new THREE.Vector3().subVectors(player.object.position, this.position);
        direction.y = 0;
        direction.normalize();
    
        const angle = Math.atan2(-direction.x, -direction.z);
        this.rotation.set(0, angle, 0);
    
        direction.multiplyScalar(step);
        return direction;
        }

    destroyFrowner(scene) {
        console.log("Frowner ded :/")
        scene.remove(this);
        world.removeBody(this.body);
    }
}