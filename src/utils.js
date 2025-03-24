import * as THREE from 'three';
import * as CANNON from 'cannon-es';

CANNON.Vec3.prototype.toThree = function() {
    return new THREE.Vector3(this.x, this.y, this.z);
}

THREE.Vector3.prototype.toCannon = function() {
    return new CANNON.Vec3(this.x, this.y, this.z);
}