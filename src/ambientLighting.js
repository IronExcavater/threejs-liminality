import {player, scene, settings} from './app.js';
import DynamicSpotLight from './DynamicSpotLight.js';
import {randomRange} from './utils.js';

export default class AmbientLighting {
    constructor(
        durationRange = [10000, 15000],
        delayRange = [0, 0],
        events = ['blackout', 'blood']
    ) {

        this.ceilingLights = [];
        this.availableLights = new Set();
        this.activeLights = [];

        for (let i = 0; i < settings.maxNumLights; i++) {
            const light = new DynamicSpotLight(0xffffff);
            light.enabled = false;
            scene.add(light);
            this.ceilingLights.push(light);
            this.availableLights.add(light);
        }

        this.durationRange = durationRange;
        this.delayRange = delayRange;
        this.events = events;
        this.isLooping = false;
    }

    showCeilingLight(position) {
        let light;
        const distanceSquared = position.distanceToSquared(player.object.position);

        if (this.availableLights.size === 0) {
            this.activeLights.sort((a, b) => a.distanceSquared - b.distanceSquared);
            const farthest = this.activeLights[this.activeLights.length - 1];
            if (distanceSquared < farthest.distanceSquared) {
                light = this.activeLights.pop();
            }
        } else {
            light = this.availableLights.values().next().value;
            this.availableLights.delete(light);
        }

        if (light === undefined) return null;

        light.position.copy(position);
        light.enabled = true;

        this.activeLights.push(light);
        return light;
    }

    hideCeilingLight(light) {
        this.activeLights.splice(this.activeLights.indexOf(light), 1);
        light.enabled = false;
        this.availableLights.add(light);
    }

    startLoop() {
        if (this.isLooping) return;
        this.isLooping = true;
        this.queueNext();
    }

    stopLoop() {
        this.isLooping = false;
    }

    queueNext() {
        if (!this.isLooping) return;

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
        console.log('triggerLightingEvent', eventName, eventDuration);
        this.ceilingLights.forEach(ceilingLight => ceilingLight.triggerLightingEvent(eventName, eventDuration));
    }
}