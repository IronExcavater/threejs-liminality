import * as THREE from 'three';
import {audioListener, player, scene} from './app.js';
import {getSound} from './resources.js';
import {randomRange} from './utils.js';
import {Tween} from "./tween.js";

class AmbientSound {
    constructor(
        distanceRange = [30, 60],
        volumeRange = [0.8, 1.2],
        delayRange = [10000, 20000]
    ) {
        this.object = new THREE.Object3D();

        this.globalSound = new THREE.Audio(audioListener);
        this.globalSound.setVolume(1);
        this.object.add(this.globalSound);

        this.positionalSound = new THREE.PositionalAudio(audioListener);
        this.positionalSound.setRefDistance(5);
        this.positionalSound.setVolume(10);
        this.object.add(this.positionalSound);
        scene.add(this.object);

        this.distanceRange = distanceRange;
        this.volumeRange = volumeRange;
        this.delayRange = delayRange;

        this.isLooping = false;
    }

    playGlobalSound(name) {
        if (this.globalSound.isPlaying) {
            new Tween({
                setter: volume => this.globalSound.setVolume(volume),
                startValue: this.globalSound.getVolume(),
                endValue: 0,
                duration: 1,
                onComplete: () => {
                    this.globalSound.stop();
                    this.globalSound.setBuffer(getSound(name));
                    this.globalSound.play();
                }
            });
        }
        else {
            this.globalSound.setBuffer(getSound(name));
            this.globalSound.play();
        }
    }

    startLoop() {
        if (this.isLooping) return;
        this.isLooping = true;
        this.queueNext();
    }

    stopLoop() {
        this.isLooping = false;

        new Tween({
            setter: volume => this.positionalSound.setVolume(volume),
            startValue: this.positionalSound.getVolume(),
            endValue: 0,
            duration: 1,
            onComplete: () => this.positionalSound.stop()
        });
    }

    queueNext() {
        const delay = randomRange(this.delayRange[0], this.delayRange[1]);

        setTimeout(() => {
            const origin = player.object.position.clone();
            const angle = randomRange(0, 359);
            const distance = randomRange(this.distanceRange[0], this.distanceRange[1]);
            const offset = new THREE.Vector3(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );

            this.object.position.copy(origin.add(offset));

            this.positionalSound.setBuffer(getSound('ambient'));
            this.positionalSound.setVolume(randomRange(this.volumeRange[0], this.volumeRange[1]));

            this.positionalSound.onEnded = () => {
                if (this.isLooping) this.queueNext(); // queue after sound ends
            };

            this.positionalSound.play();
        }, delay);
    }
}

export default AmbientSound;