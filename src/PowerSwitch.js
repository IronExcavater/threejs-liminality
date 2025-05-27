import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getModel, getSound} from './resources.js';
import {addUpdatable, audioListener, canEscape, getPower, increasePower, maze} from './app.js';
import CeilingLight from './CeilingLight.js';

export default class PowerSwitch extends ModelObject {
    constructor({
        cell,
        scale = new THREE.Vector3(0.5, 0.5, 0.5),
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
        state = false,
    }) {
        super({
            model: getModel('powerSwitch'),
            scale: scale,
            position: position,
            rotation: rotation,
            interactRadius: 0.4,
        });

        this.cell = cell;

        const target = this.mesh.getObjectByName('Object_10');
        this.mixer = new THREE.AnimationMixer(target); // Slightly dodgy as the animation should be on root

        this.sound = new THREE.PositionalAudio(audioListener);
        this.sound.setRefDistance(5);
        this.sound.setVolume(1);
        this.add(this.sound);

        this.state = state;
        if (state) this.activateAnimation();
        this.interactCallback = this.onInteract.bind(this);
        this.canInteract = true;

        addUpdatable(this);
    }

    onInteract(player) {
        if (this.state) return;

        this.state = true;
        increasePower();
        console.log("Turn switch on, total power: " + getPower());

        this.sound.setBuffer(getSound(canEscape() ? 'powerOn' : 'switch'));
        this.sound.play();

        //const powerSwitch = maze.findEntityFromWorld('powerSwitch', this.position.x, this.position.z);
        const powerSwitch = maze.findEntityFromGrid('powerSwitch', this.cell.x, this.cell.y);
        if (powerSwitch != null) {
            powerSwitch.state = true;
            this.activateNearbyLights(powerSwitch);
        }

        this.activateAnimation();
    }

    activateNearbyLights(powerSwitch) {
        for (const ceilingLight of powerSwitch.ceilingLights) {
            ceilingLight.state = true;
            const chunk = maze.worldToChunk(ceilingLight.x, ceilingLight.z);
            const chunkData = maze.instantiated.get(chunk.key());
            if (chunkData === undefined) continue;
            for (const obj of chunkData) {
                if (obj instanceof CeilingLight) {
                    obj.state = true;
                    break;
                }
            }
        }
    }

    activateAnimation() {
        if (this.animations.length > 0) {
            const clip = THREE.AnimationClip.findByName(this.animations, 'Activate');
            if (clip) {
                const action = this.mixer.clipAction(clip);
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.play();
            }
        }
    }

    update(delta) {
        this.mixer.update(delta);
    }
}