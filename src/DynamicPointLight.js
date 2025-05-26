import * as THREE from 'three';
import {addUpdatable, audioListener, scene} from './app.js';
import {Easing, Tween} from './tween.js';

export default class DynamicPointLight extends THREE.PointLight {
    constructor(color = 0xffffff, intensity = 1, distance = 0, penumbra = 2) {
        super(color, intensity, distance, penumbra);

        this.enabled = false;

        this.sound = new THREE.PositionalAudio(audioListener);
        this.sound.setRefDistance(10);
        this.sound.setVolume(1);
        this.add(this.sound);

        this.flickerDuration = 0;
        this.flickerCooldown = 0;

        scene.add(this);
        addUpdatable(this);
    }

    raycast() {}

    update(delta) {
        this.visible = this.enabled;

        if (!this.enabled) return;

        if (this.flickerCooldown <= 0 && Math.random() < 0.2) {
            this.flickerDuration = Math.random() * 0.2 + 0.05;
            this.flickerCooldown = this.flickerDuration + 2 + Math.random() * 5;
        }

        this.flickerDuration -= delta;
        this.flickerCooldown -= delta;

        this.intensity = this.flickerDuration > 0 ? THREE.MathUtils.lerp(0.2, 5, Math.random()) : 0;

    }

    triggerLightingEvent(eventName, eventDuration) {
        switch (eventName) {
            case 'blackout':
                this.flickerCooldown = eventDuration;
                break;
            case 'blood':
                new Tween({
                    setter: color => this.color = color,
                    startValue: this.color,
                    endValue: 0xff0000,
                    duration: 1,
                    easing: Easing.EaseInCubic(),
                    onComplete: () => {
                        setTimeout(() => {
                            new Tween({
                                setter: color => this.color = color,
                                startValue: this.color,
                                endValue: 0xffffff,
                                duration: 2,
                                easing: Easing.EaseOutCubic(),
                            });
                        }, eventDuration - 3);
                    }
                })
                break;
        }
    }
}