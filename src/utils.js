import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Convert between CANNON.Vec3 and THREE.Vector3
CANNON.Vec3.prototype.toThree = function() {
    return new THREE.Vector3(this.x, this.y, this.z);
}
THREE.Vector3.prototype.toCannon = function() {
    return new CANNON.Vec3(this.x, this.y, this.z);
}

// Basic Vector3
Object.defineProperties(THREE.Vector3, {
    up:     { get: () => new THREE.Vector3(0, 1, 0) },
    down:   { get: () => new THREE.Vector3(0, -1, 0) },
    right:  { get: () => new THREE.Vector3(1, 0, 0) },
    left:   { get: () => new THREE.Vector3(-1, 0, 0) },
    front:  { get: () => new THREE.Vector3(0, 0, 1) },
    back:   { get: () => new THREE.Vector3(0, 0, -1) },
    one:    { get: () => new THREE.Vector3(1, 1, 1) },
    zero:   { get: () => new THREE.Vector3(0, 0, 0) },
});

Object.defineProperties(THREE.Vector2, {
    one:    { get: () => new THREE.Vector2(1, 1) },
});

Object.defineProperties(CANNON.Vec3, {
    up:     { get: () => new CANNON.Vec3(0, 1, 0) },
    down:   { get: () => new CANNON.Vec3(0, -1, 0) },
    right:  { get: () => new CANNON.Vec3(1, 0, 0) },
    left:   { get: () => new CANNON.Vec3(-1, 0, 0) },
    front:  { get: () => new CANNON.Vec3(0, 0, 1) },
    back:   { get: () => new CANNON.Vec3(0, 0, -1) },
    one:    { get: () => new CANNON.Vec3(1, 1, 1) },
    zero:   { get: () => new CANNON.Vec3(0, 0, 0) },
});

// Extend Classes with reactive onChange()
function onChange(object) {
    if (typeof object.onChangeCallback === 'function') object.onChangeCallback();
}
function addOnChange(Class, methodnames = []) {
    Class.prototype.onChangeCallback = null;
    Class.prototype.onChange = function (callback) {
        this.onChangeCallback = callback;
        return this;
    };

    for (const method of methodnames) {
        const original = Class.prototype[method];

        Class.prototype[method] = function (...args) {
            const result = original.apply(this, args);
            onChange(this);
            return result;
        }
    }
}

addOnChange(THREE.Vector3, ['set', 'copy', 'add', 'sub']);
addOnChange(THREE.Euler, ['set', 'copy', 'setFromQuaternion']);
addOnChange(THREE.Quaternion, ['set', 'copy', 'setFromEuler']);