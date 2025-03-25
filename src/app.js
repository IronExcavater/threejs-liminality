import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import TestRoom from './TestRoom.js';
import Player from "./Player.js";
import './utils.js'

const updatables = [];
const clock = new THREE.Clock();

// Core three.js components
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
    90, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop(() => update(clock.getDelta()));

window.addEventListener('resize', () => windowResize());
windowResize();

// Core cannon.js components
export const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.81, 0),
});

// Level components
new Player();
new TestRoom(); // Temp

function windowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function update(delta) {
    world.fixedStep();
    for (const obj of updatables) obj.update(delta);
    renderer.render(scene, camera);
}

export function addUpdatable(obj) {
    if (typeof obj?.update === 'function') {
        updatables.push(obj);
    } else {
        console.warn('Object invalid for updatables; no update method:', obj);
    }
}

export function removeUpdatable(obj) {
    const index = updatables.indexOf(obj);
    if (index > -1) {
        updatables.splice(index, 1);
    } else {
        console.warn('Object not found in updatables:', obj);
    }
}