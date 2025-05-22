import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {collisionFilters, removeUpdatable, scene, world} from './app.js';
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
            fixedRotation: true,
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
        });
        this.quaternion.onChange(() => {
            this.body.quaternion.copy(this.quaternion);
        });

        this.position.copy(position);
        this.rotation.copy(rotation);
        this.setUVRepeat();
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
        if (!this.canInteract) return;

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

    setUVRepeat() {
        const size = new THREE.Vector3();
        new THREE.Box3().setFromObject(this).getSize(size);

        const maps = ['map', 'normalMap', 'roughnessMap'];
        for (const map of maps) {
            const tex = this.mesh.material[map];
            if (tex) {
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(size.x, size.z);
                tex.needsUpdate = true;
            }
        }
    }

    dispose() {
        scene.remove(this);
        world.removeBody(this.body);
        removeUpdatable(this);

        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) {
            if (this.mesh.material.map) this.mesh.material.map.dispose();
            this.mesh.material.dispose();
        }
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
        this.scale.copy(vector3);
        this.body.removeShape(this.shape);
        this.shape = new CANNON.Box(new CANNON.Vec3(vector3.x / 2, vector3.y / 2, vector3.z / 2));
        this.body.addShape(this.shape);
        this.setUVRepeat();
    }

    setPosition(vector3) {
        this.position.set(vector3.x, vector3.y, vector3.z);
    }
}

// ModelObject replaces GameObject mesh with model. Collider is currently hardcoded as a sphere with radius of scale/2.
export class ModelObject extends GameObject {
    constructor({
        model = {},
        scale = THREE.Vector3.one,
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        shapeType = 'box', // 'box', 'cylinder', 'sphere'
        mass = 0,
        interactRadius = 0,
        interactCallback = null,
    }) {
        super({
            geometry: new THREE.BoxGeometry(),
            material: new THREE.MeshStandardMaterial({visible: false}),
            shape: new CANNON.Box(new CANNON.Vec3()),
            position: position,
            rotation: rotation,
            mass: mass,
            interactRadius: interactRadius,
            interactCallback: interactCallback,
        });

        if (model.animations === undefined || model.scene === undefined) {
            console.warn('Object specified as model isn\'t valid', model);
            return;
        }

        this.shapeType = shapeType;
        this.animations = model.animations;

        this.remove(this.mesh);

        this.mesh = new THREE.Object3D();
        this.mesh.add(model.scene);
        this.mesh.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model.scene);
        const size = new THREE.Vector3(); box.getSize(size);
        const center = new THREE.Vector3(); box.getCenter(center);

        model.scene.position.sub(center);

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
        this.scale.copy(finalScale);

        this.body.removeShape(this.shape);
        const box = new THREE.Box3().setFromObject(this);
        const size = new THREE.Vector3(); box.getSize(size);
        const center = new THREE.Vector3(); box.getCenter(center);

        switch (this.shapeType) {
            case 'box':
                this.shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
                break;
            case 'cylinder':
                const cRadius = (size.x + size.z) / 4;
                this.shape = new CANNON.Cylinder(cRadius, cRadius, size.y, 16);
                break;
            case 'sphere':
                const sRadius = (size.x + size.y + size.z) / 6;
                this.shape = new CANNON.Sphere(sRadius);
                break;
        }

        const localQuaternion = new CANNON.Quaternion().copy(this.quaternion);

        this.body.addShape(this.shape, CANNON.Vec3.zero, localQuaternion);
        this.body.updateBoundingRadius();
        this.body.aabbNeedsUpdate = true;
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

    dispose() {
        scene.remove(this);
        world.removeBody(this.body);
        removeUpdatable(this);

        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.geometry?.dispose();
                if (child.material?.map) child.material.map.dispose();
                child.material?.dispose();
            }
        });
    }
}

export class CylinderObject extends GameObject {
    constructor({
        radiusTop = 0.5,
        radiusBottom = 0.5,
        height = 1,
        material = new THREE.MeshBasicMaterial({}),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
        interactRadius = 0,
        interactCallback = null,
    }) {
        super({
            geometry: new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16),
            material: material,
            shape: new CANNON.Cylinder(radiusTop, radiusBottom, height, 16),
            position: position,
            rotation: rotation,
            mass: mass,
            interactRadius: interactRadius,
            interactCallback: interactCallback,
        });
    }

    setScale(vector3) {
        this.scale.copy(vector3);
        this.body.removeShape(this.shape);
        const radius = (vector3.x + vector3.z) / 2;
        this.shape = new CANNON.Cylinder(radius, radius, vector3.y, 16);
        this.body.addShape(this.shape);
        this.setUVRepeat();
    }
}

export class SphereObject extends GameObject {
    constructor({
        radius = 1,
        material = new THREE.MeshBasicMaterial({}),
        position = new THREE.Vector3(),
        rotation = new THREE.Euler(),
        mass = 0,
        interactRadius = 0,
        interactCallback = null,
    }) {
        super({
            geometry: new THREE.SphereGeometry(radius, 16, 16),
            material: material,
            shape: new CANNON.Sphere(radius),
            position: position,
            rotation: rotation,
            mass: mass,
            interactRadius: interactRadius,
            interactCallback: interactCallback,
        });
    }

    setScale(vector3) {
        this.scale.copy(vector3);
        this.body.removeShape(this.shape);
        const radius = (vector3.x + vector3.y + vector3.z) / 3;
        this.shape = new CANNON.Sphere(radius);
        this.body.addShape(this.shape);
        this.setUVRepeat();
    }
}