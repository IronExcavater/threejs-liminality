import * as THREE from 'three';
import {MeshStandardMaterial} from "three";

class TestRoom {
    constructor(app) {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(5, 5);
        const floorMat = new MeshStandardMaterial(({
            color: 0x8a7d65,
        }));
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -1, 0);
        floor.receiveShadow = true;
        app.scene.add(floor);

        const roof = floor.clone(true);
        roof.rotation.x = Math.PI / 2;
        roof.position.set(0, 1, 0);
        app.scene.add(roof);

        // Wall
        const wallGeo = new THREE.BoxGeometry(5, 2, 1);
        const wallMat = new MeshStandardMaterial(({
            color: 0xebd8b7,
        }));
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 0, -3);
        wall.receiveShadow = true;
        app.scene.add(wall);

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        app.scene.add(ambientLight);

        // Directional Light
        const directionalLight = new THREE.PointLight(0xffffff, 2, 5);
        directionalLight.position.set(0, 0.9, -1);
        app.scene.add(directionalLight);
    }
}

export default TestRoom;