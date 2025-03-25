import * as THREE from 'three';
import * as CANNON from 'cannon-es';

CANNON.Vec3.prototype.toThree = function() {
    return new THREE.Vector3(this.x, this.y, this.z);
}

THREE.Vector3.prototype.toCannon = function() {
    return new CANNON.Vec3(this.x, this.y, this.z);
}

THREE.Vector3.up = new THREE.Vector3(0, 1, 0);
THREE.Vector3.down = new THREE.Vector3(0, -1, 0);
THREE.Vector3.right = new THREE.Vector3(1, 0, 0);
THREE.Vector3.left = new THREE.Vector3(-1, 0, 0);
THREE.Vector3.front = new THREE.Vector3(0, 0, 1);
THREE.Vector3.back = new THREE.Vector3(0, 0, -1);
THREE.Vector3.one = new THREE.Vector3(1, 1, 1);
THREE.Vector3.zero = new THREE.Vector3(0, 0, 0);

CANNON.Vec3.up = new CANNON.Vec3(0, 1, 0);
CANNON.Vec3.down = new CANNON.Vec3(0, -1, 0);
CANNON.Vec3.right = new CANNON.Vec3(1, 0, 0);
CANNON.Vec3.left = new CANNON.Vec3(-1, 0, 0);
CANNON.Vec3.front = new CANNON.Vec3(0, 0, 1);
CANNON.Vec3.back = new CANNON.Vec3(0, 0, -1);
CANNON.Vec3.one = new CANNON.Vec3(1, 1, 1);
CANNON.Vec3.zero = new CANNON.Vec3(0, 0, 0);