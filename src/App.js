import * as THREE from 'three';
import TestRoom from './TestRoom.js';
import Player from "./Player.js";

class App {
    constructor() {
        this.updatables = [];

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.clock = new THREE.Clock();

        const testRoom = new TestRoom(this);

        this.addUpdatable(new Player(this));

        window.addEventListener('resize', () => this.windowResize());
        this.windowResize();

        this.renderer.setAnimationLoop(() => this.update(this.clock.getDelta()));
    }

    windowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(delta) {
        for (const obj of this.updatables) obj.update(delta);
        this.renderer.render(this.scene, this.camera);
    }

    addUpdatable(obj) {
        if (typeof obj?.update === 'function') {
            this.updatables.push(obj);
        } else {
            console.warn('Object invalid for updatables; no update method:', obj);
        }
    }

    removeUpdatable(obj) {
        const index = this.updatables.indexOf(obj);
        if (index > -1) {
            this.updatables.splice(index, 1);
        } else {
            console.warn('Object not found in updatables', obj);
        }
    }
}

export default App;