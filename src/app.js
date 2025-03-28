import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import TestRoom from './TestRoom.js';
import Player from './Player.js';
import CannonDebugRenderer from './CannonDebugRenderer.js';
import {updateConsole} from './console.js'
import './utils.js'

import '/styles/app.css';

const updatables = [];
const clock = new THREE.Clock();

export const ids = new Map([
    ['Player', 100],
]);

export const collisionFilters = new Map([ // Must be powers of 2
    ['World', 1],
    ['Player', 2],
])

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
    frictionGravity: CANNON.Vec3.zero,
});

// Debuggers
export const wireframeRenderer = new CannonDebugRenderer(scene, world);
export const debug = {
    noclip: false,
    wireframe: false,
    fullbright: false,
};

// Level components
export const player = new Player({
    walkSpeed: 8,
    jumpStrength: 4,
    groundFriction: 4,
    width: 0.5,
    height: 1.2,
});

export const ambientLight = new THREE.AmbientLight(0xffffff, 0.001);
scene.add(ambientLight);

new TestRoom();

function windowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function update(delta) {
    world.fixedStep();
    updateConsole();
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