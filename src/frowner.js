import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getModel, getSound} from './resources.js';
import {addUpdatable, ambientSound, audioListener, ids, player, scene} from './app.js';
import {randomRange} from './utils.js';
import {fadeIn, fadeOut} from './transition.js';
import {walkSpeed, runSpeed} from './Player.js';


export default class frowner extends ModelObject {
    constructor({
        scale = new THREE.Vector3(1, 1, 1),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        moveSpeed = 150,
        attached = false
    }) {
        super ({
            model: getModel ('frownMask'),
            scale,
            position,
            rotation,
            shapeType: 'cylinder', 
            mass: 500,
        });

        this.body.addEventListener('collide', (e) => {
                    const other = e.body;
        
                    if (other.id === ids.get('Player') && this.isMoving && attached == false) {
                        console.log("Da frowner has latched onto you uh oh spaghettio");
                        ambientSound.playGlobalSound('riser');
                        attached = true;
                        new Tween({
                                    setter: quaternion => this.quaternion.copy(quaternion),
                                    startValue: this.quaternion.clone(),
                                    endValue: () => {
                                        const euler = new THREE.Euler().setFromQuaternion(player.object.quaternion);
                                        euler.y += Math.PI;
                                        return new THREE.Quaternion().setFromEuler(euler);
                                    },
                                    duration: 1,
                                });
                        other.position = player.object.localToWorld(new THREE.Vector2(0, 0, 0));
                        //adjust to ideally cover the players face
                        
                    }
            });

        addUpdatable(this);
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
}