import {ModelObject} from './GameObject.js';
import {getModel, getSound} from './resources.js';
import * as THREE from 'three';
import {addUpdatable, world, player, audioListener} from './app.js';
import {Tween} from './tween.js';
import {getKey} from "./input.js";

class Flashlight extends ModelObject {
    constructor({
        scale = new THREE.Vector3(0.4, 0.4, 0.4),
        position = new THREE.Vector3.zero,
        rotation = new THREE.Euler.identity,
    }) {
        super({
            model: getModel('flashlight'),
            scale: scale,
            position: position,
            rotation: rotation,
            interactRadius: 0.4,
        });

        this.interactCallback = this.onInteract.bind(this);
        this.canInteract = true;

        this.glowLight = new THREE.PointLight(0xffffff, 0.3, 1, 2);
        this.add(this.glowLight);
        this.glowLight.position.set(0, 100, 0);

        this._spot = new THREE.SpotLight(0xffffff, 0, 20, Math.PI / 3, 1, 1);
        this._spot.target.position.set(0, 0, 2);
        this.add(this._spot);
        this.add(this._spot.target);

        this.sound = new THREE.PositionalAudio(audioListener);
        this.sound.setRefDistance(10);
        this.sound.setVolume(1);
        this.add(this.sound);

        this.equipped = false;
        this.enabled = false;

        this.targetPosition = new THREE.Vector3();
        this.targetRotation = new THREE.Quaternion();

        this.flickerDuration = 0;
        this.flickerCooldown = 0;

        addUpdatable(this);
    }

    onInteract(player) {
        world.removeBody(this.body);
        this.canInteract = false;

        new Tween({
            setter: intensity => this.glowLight.intensity = intensity,
            startValue: this.glowLight.intensity,
            endValue: 0,
            duration: 1,
        });

        new Tween({
            setter: position => this.position.copy(position),
            startValue: this.position.clone(),
            endValue: () => this.flashlightPosition,
            duration: 1,
            onComplete: () => {
                this.equipped = true;
                this.enabled = true;
                this.sound.setBuffer(getSound('flashlightClick'));
                this.sound.play();
            },
        });

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
    }

    update(delta) {
        const forward = player.object.getWorldDirection(new THREE.Vector3());
        this.flashlightPosition = player.object.localToWorld(new THREE.Vector3(0.3, -0.3, -0.2));
        this.targetPosition = player.object.position.clone()
            .add(forward.multiplyScalar(2))
            .add(new THREE.Vector3(0, -1, 0));

        const lookMatrix = new THREE.Matrix4().lookAt(this.position, this.targetPosition, new THREE.Vector3(0, 1, 0));
        this.targetRotation.setFromRotationMatrix(lookMatrix);

        if (!this.equipped) return;

        if (getKey('KeyR', true)) {
            this.enabled = !this.enabled;
            this.sound.setBuffer(getSound('flashlightClick'));
            this.sound.play();
        }

        this.position.copy(this.flashlightPosition);
        this.quaternion.slerp(this.targetRotation, 0.1);

        if (this.flickerCooldown <= 0 && Math.random() < 0.2) {
            this.flickerDuration = Math.random() * 0.2 + 0.05;
            this.flickerCooldown = this.flickerDuration + 2 + Math.random() * 5;
        }

        this.flickerDuration -= delta;
        this.flickerCooldown -= delta;

        this._spot.intensity = this.enabled ? this.flickerDuration > 0 ? 1 : 5 : 0;
    }
}

export default Flashlight;