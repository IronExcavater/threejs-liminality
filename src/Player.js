import * as THREE from 'three';
import Controls from "./Controls.js";

class Player {
    constructor(app) {
        this.object = new THREE.Object3D();
        this.object.add(app.camera);
        app.scene.add(this.object);

        this.controls = new Controls(this.object);
    }

    update(delta) {
        this.controls.update(delta);
    }
}

export default Player;