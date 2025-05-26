import {scene, settings} from './app.js';
import DynamicPointLight from './DynamicPointLight.js';
import {randomRange} from "./utils.js";

export default class AmbientLighting {
    constructor(
        durationRange = [10000, 15000],
        delayRange = [20000, 40000],
        events = ['blackout', 'blood']
    ) {
        this.ceilingLights = new Array(settings.maxNumLights).fill(0).map(() => {
            const light = new DynamicPointLight(0xffffff, 0.4);
            light.visible = false;
            scene.add(light);
            return light;
        });

        this.durationRange = durationRange;
        this.delayRange = delayRange;
        this.events = events;
        this.currentNumLights = 0;

        this.isLooping = false;
    }

    canCreateLight() {
        return this.currentNumLights < settings.maxNumLights;
    }

    showCeilingLight(position) {
        if (!this.canCreateLight()) return;
        for (const ceilingLight of this.ceilingLights) {
            if (ceilingLight.enabled === false) {
                this.currentNumLights++;
                ceilingLight.position.copy(position);
                ceilingLight.enabled = true;
                return ceilingLight;
            }
        }
    }

    hideCeilingLight(ceilingLight) {
        ceilingLight.enabled = false;
        this.currentNumLights--;
    }

    startLoop() {
        if (this.isLooping) return;
        this.isLooping = true;
        const delay = randomRange(this.delayRange[0], this.delayRange[1]);
        this.queueNext();
    }

    stopLoop() {
        this.isLooping = false;
    }

    queueNext() {
        const duration = randomRange(this.durationRange[0], this.durationRange[1]);
        const delay = randomRange(this.delayRange[0], this.delayRange[1]);

        setTimeout(() => {
            this.triggerLightingEvent(this.events[randomRange(0, this.events.length-1)], duration);
            setTimeout(() => {
                this.queueNext();
            }, duration);
        }, delay);
    }

    triggerLightingEvent(eventName, eventDuration) {
        this.ceilingLights.forEach(ceilingLight => ceilingLight.triggerLightingEvent(eventName, eventDuration));
    }
}