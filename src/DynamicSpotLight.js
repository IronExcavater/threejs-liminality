import * as THREE from 'three';
import {addUpdatable, audioListener, scene} from './app.js';
import {Easing, Tween} from './tween.js';

export default class DynamicSpotLight extends THREE.SpotLight {
    constructor(color = 0xffffff, intensity = 5, distance = 3, angle = Math.PI / 2, penumbra = 1, delay = 2) {
        super(color, intensity, distance, angle, penumbra, delay);

        this.enabled = false;

        this.sound = new THREE.PositionalAudio(audioListener);
        this.sound.setRefDistance(10);
        this.sound.setVolume(1);
        this.add(this.sound);

        this.flickerDuration = 0;
        this.flickerCooldown = 0;

        this.distanceSquared = 0;

        scene.add(this);
        scene.add(this.target);

        this.position.onChange(() => {
            this.target.position.copy(this.position).add(new THREE.Vector3(0, -0.1, 0));
        });
        addUpdatable(this);
    }

    raycast() {}

    update(delta) {

        //if (this.enabled !== this.visible) this.visible = this.enabled;

        //if (!this.enabled) return;

        if (this.flickerCooldown <= 0 && Math.random() < 0.2) {
            this.flickerDuration = Math.random() * 0.2 + 0.05;
            this.flickerCooldown = this.flickerDuration + 2 + Math.random() * 5;
        }

        this.flickerDuration -= delta;
        this.flickerCooldown -= delta;

        this.intensity = this.enabled ? this.flickerDuration > 0 ? 1 : 5 : 0;

    }

    triggerLightingEvent(eventName, eventDuration) {
        switch (eventName) {
            case 'blackout':
                this.flickerDuration = eventDuration;
                this.flickerCooldown = eventDuration;
                break;
            case 'blood':
                new Tween({
                    setter: color => this.color = color,
                    startValue: this.color,
                    endValue: new THREE.Color(0xff0000),
                    duration: 1,
                    easing: t => Easing.EaseInCubic(t),
                    onComplete: () => {
                        setTimeout(() => {
                            new Tween({
                                setter: color => this.color = color,
                                startValue: this.color,
                                endValue: new THREE.Color(0xffffff),
                                duration: 2,
                                easing: t => Easing.EaseOutCubic(t),
                            });
                        }, eventDuration - 3000);
                    }
                })
                break;
        }
    }
}