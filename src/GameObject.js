import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {collisionFilters, scene, world} from './app.js';
import './utils.js';

export class GameObject extends THREE.Object3D {
    constructor({
        geometry, material, shape,
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
        interactRadius = 0,
        interactCallback = null,
    }) {
        super();

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.add(this.mesh);

        this.shape = shape;
        this.body = new CANNON.Body({
            mass: mass,
            shape: this.shape,
            collisionFilterGroup: collisionFilters.get('World'),
            collisionFilterMask: collisionFilters.get('World') | collisionFilters.get('Player'),
        });

        world.addBody(this.body);
        this.addEventListener('added', () => world.addBody(this.body));
        this.addEventListener('removed', () => world.removeBody(this.body));

        this.canInteract = interactCallback != null;
        this.interactCallback = interactCallback;
        this.interactRadius = interactRadius;

        scene.add(this);

        this.position.onChange(() => {
            this.body.position.copy(this.position.toCannon());
        })
        this.quaternion.onChange(() => {
            this.body.quaternion.copy(this.quaternion);
        })

        this.position.copy(position);
        this.rotation.copy(rotation);
    }

    raycast(raycaster, intersects) {
        this.interactRaycast(raycaster, intersects);
        this.meshRaycast(raycaster, intersects);
    }

    meshRaycast(raycaster, intersects) {
        const meshIntersects = [];
        this.mesh.raycast(raycaster, meshIntersects);

        for (const hit of meshIntersects) {
            hit.object = this;
            intersects.push(hit);
        }
    }

    interactRaycast(raycaster, intersects) {
        if (!this.interactCallback) return;

        const worldPos = new THREE.Vector3();
        this.getWorldPosition(worldPos);

        const distanceToOrigin = raycaster.ray.distanceToPoint(worldPos);
        if (distanceToOrigin > this.interactRadius) return;

        const intersectPoint = new THREE.Vector3();
        raycaster.ray.closestPointToPoint(worldPos, intersectPoint);
        const distanceToIntersect = raycaster.ray.origin.distanceTo(intersectPoint);

        if (distanceToIntersect > raycaster.far) return;

        intersects.push({
            distance: distanceToIntersect,
            point: intersectPoint,
            object: this,
        });
    }

    interact(player) {
        if (this.interactCallback) this.interactCallback(player);
    }
}

// PlaneObject collider is infinite (limitation in Cannon.js), use BoxObject for finite collider
export class PlaneObject extends GameObject {
    constructor({
        scale = THREE.Vector2.one,
        material = new THREE.MeshBasicMaterial({}),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
        interactRadius = 0,
        interactCallback = null,
    }) {
        super({
            geometry: new THREE.PlaneGeometry(scale.x, scale.y),
            material: material,
            shape: new CANNON.Plane(),
            position: position,
            rotation: rotation,
            mass: mass,
            interactRadius: interactRadius,
            interactCallback: interactCallback,
        });
    }

    setScale(vector3) {
        this.mesh.scale.set(vector3.x, vector3.y, vector3.z);
    }
}

export class BoxObject extends GameObject {
    constructor({
        scale = THREE.Vector3.one,
        material = new THREE.MeshBasicMaterial({}),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
        interactRadius = 0,
        interactCallback = null,
    }) {
        super({
            geometry: new THREE.BoxGeometry(scale.x, scale.y, scale.z),
            material: material,
            shape: new CANNON.Box(new CANNON.Vec3(scale.x / 2, scale.y / 2, scale.z / 2)),
            position: position,
            rotation: rotation,
            mass: mass,
            interactRadius: interactRadius,
            interactCallback: interactCallback,
        });
    }

    setScale(vector3) {
        this.mesh.scale.copy(vector3);
        this.body.removeShape(this.shape);
        this.shape.halfExtents.set(vector3.x, vector3.y, vector3.z);
        this.body.addShape(this.shape);
    }
}

// ModelObject replaces GameObject mesh with model. Collider is currently hardcoded as a sphere with radius of scale/2.
export class ModelObject extends GameObject {
    constructor({
        model = new THREE.Scene(),
        scale = THREE.Vector3.one,
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
        interactRadius = 0,
        interactCallback = null,
    }) {
        super({
            geometry: new THREE.BoxGeometry(),
            material: new THREE.MeshStandardMaterial({visible: false}),
            shape: new CANNON.Sphere((scale.x + scale.y + scale.z) / 6),
            position: position,
            rotation: rotation,
            mass: mass,
            interactRadius: interactRadius,
            interactCallback: interactCallback,
        });

        this.remove(this.mesh);

        this.mesh = new THREE.Object3D();
        this.mesh.add(model);
        this.mesh.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);
        box.getCenter(center);

        model.position.sub(center);

        this.normaliseScale = THREE.Vector3.one.divide(size.clone());
        this.proportionalScale = size.clone().divideScalar(Math.cbrt(size.x * size.y * size.z));
        this.maxProportion = Math.max(this.proportionalScale.x, this.proportionalScale.y, this.proportionalScale.z);

        this.add(this.mesh);
        this.setScale(scale, true);
    }

    setScale(vector3, preserveProportions = false) {
        const average = (vector3.x + vector3.y + vector3.z) / 3;

        const appliedScale = preserveProportions
            ? this.proportionalScale.clone().multiplyScalar(average / this.maxProportion)
            : vector3;

        const finalScale = new THREE.Vector3().copy(this.normaliseScale).multiply(appliedScale);
        this.mesh.scale.copy(finalScale);

        this.body.removeShape(this.shape);
        const newRadius = (appliedScale.x + appliedScale.y + appliedScale.z) / (preserveProportions ? 3 : 6);
        this.shape = new CANNON.Sphere(newRadius);
        this.body.addShape(this.shape);
    }

    meshRaycast(raycaster, intersects) {
        const meshIntersects = [];

        this.mesh.traverse(child => {
            if (child.isMesh) child.raycast(raycaster, meshIntersects);
        });

        for (const hit of meshIntersects) {
            hit.object = this;
            intersects.push(hit);
        }
    }
}