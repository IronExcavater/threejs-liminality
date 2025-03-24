import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {scene, world} from './app.js';

class TestRoom {
    constructor() {
        // Floor
        const floorGeo = new THREE.PlaneGeometry(6, 6);
        const floorMat = new THREE.MeshStandardMaterial(({
            color: 0x8a7d65,
        }));
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, -1, 0);
        floor.receiveShadow = true;
        scene.add(floor);

        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(0, -1, 0),
            shape: floorShape,
        })
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        world.addBody(floorBody);

        const roof = floor.clone(true);
        roof.rotation.x = Math.PI / 2;
        roof.position.set(0, 1, 0);
        scene.add(roof);

        // Wall
        const wallGeo = new THREE.PlaneGeometry(6, 2);
        const wallMat = new THREE.MeshStandardMaterial(({
            color: 0xebd8b7,
        }));
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(0, 0, -3);
        wall.receiveShadow = true;
        scene.add(wall);

        const wallShape = new CANNON.Plane();
        const wallBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(0, 0, -3),
            shape: wallShape,
        })
        world.addBody(wallBody);

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        scene.add(ambientLight);

        // Directional Light
        const directionalLight = new THREE.PointLight(0xffffff, 2, 5);
        directionalLight.position.set(0, 0.9, -1);
        scene.add(directionalLight);
    }
}

export default TestRoom;