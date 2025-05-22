import * as THREE from 'three';
import {ModelObject} from './GameObject.js';
import {getModel, getSound} from './resources.js';
import {addUpdatable, audioListener, canEscape, ids} from './app.js';
import {fadeIn} from "./transition.js";

class ExitDoor extends ModelObject {
    constructor({
        scale = new THREE.Vector3(1.5, 1.5, 1.5),
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
    }) {
        super({
            model: getModel('exitDoor'),
            scale: scale,
            position: position,
            rotation: rotation,
            interactRadius: 0.4,
        });

        const target = this.mesh.getObjectByName('Door');
        this.mixer = new THREE.AnimationMixer(target);

        this.sound = new THREE.PositionalAudio(audioListener);
        this.sound.setRefDistance(5);
        this.sound.setVolume(1);
        this.add(this.sound);

        this.state = canEscape();
        if (this.state) this.activateAnimation();
        this.interactCallback = this.onInteract.bind(this);
        this.canInteract = true;

        this.body.addEventListener('collide', (e) => {
            const other = e.body;

            if (other.id === ids.get('Player')) {
                this.nextLevel();
            }
        });

        addUpdatable(this);
    }

    onInteract(player) {
        if (this.state) {
            this.nextLevel();
        }
        else{
            this.sound.setBuffer(getSound('doorKnock'));
            this.sound.play();
        }
    }

    activateAnimation() {
        this.sound.setBuffer(getSound('doorOpen'));
        this.sound.play();

        if (this.animations.length > 0) {
            const clip = THREE.AnimationClip.findByName(this.animations, 'Open');
            if (clip) {
                const action = this.mixer.clipAction(clip);
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished = true;
                action.play();
            }
        }
    }

    nextLevel() {
        console.log("Finished level, loading new generation");
        fadeIn({
            text: 'You\'ve Escaped',
            onComplete: () => {
                location.reload();
            }
        });
    }

    update(delta) {
        this.mixer.update(delta);

        const newState = canEscape();
        if (!this.state && newState) {
            this.state = true;
            this.activateAnimation();
        }
    }
}

export default ExitDoor;