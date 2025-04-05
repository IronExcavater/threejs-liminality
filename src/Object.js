import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {collisionFilters, scene, world} from './app.js';
import './utils.js';

export class Object {
    constructor({
        geometry, material, shape,
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
    }) {
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        scene.add(this.mesh);

        this.body = new CANNON.Body({
            mass: mass,
            shape: shape,
            collisionFilterGroup: collisionFilters.get('World'),
            collisionFilterMask: collisionFilters.get('World') | collisionFilters.get('Player'),
        });
        world.addBody(this.body);

        this.setPosition(position);
        this.setRotation(rotation);
    }

    setPosition(vector3) {
        this.mesh.position.set(vector3.x, vector3.y, vector3.z);
        this.body.position.set(vector3.x, vector3.y, vector3.z);
    }

    setRotation(vector3) {
        this.mesh.rotation.set(vector3.x, vector3.y, vector3.z);
        this.body.quaternion.setFromEuler(vector3.x, vector3.y, vector3.z);
    }
}

export class PlaneObject extends Object {
    constructor({
        material = new THREE.MeshStandardMaterial(),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
    }) {
        super({
            geometry: new THREE.PlaneGeometry(10, 10),
            material: material,
            shape: new CANNON.Plane(),
            position: position,
            rotation: rotation,
            mass: mass,
        });
    }
}

export class BoxObject extends Object {
    constructor({
        size = new THREE.Vector3(),
        material = new THREE.MeshStandardMaterial(),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
    }) {
        super({
            geometry: new THREE.BoxGeometry(size.x, size.y, size.z),
            material: material,
            shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
            position: position,
            rotation: rotation,
            mass: mass,
        });
    }
}