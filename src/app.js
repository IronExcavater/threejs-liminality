import * as THREE from 'three';
import {EffectComposer, OutlinePass, RenderPass} from 'three/addons';
import * as CANNON from 'cannon-es';
import Player from './Player.js';
import Maze from './Maze.js';
import CannonDebugRenderer from './CannonDebugRenderer.js';
import {updateTweens} from './tween.js';
import {updateConsole} from './console.js';
import {preloadResources} from './resources.js';
import './utils.js';

import '/styles/app.css';
import Flashlight from "./Flashlight.js";

const updatables = [];
const clock = new THREE.Clock();

export const ids = new Map([
    ['Player', 100],
]);

export const collisionFilters = new Map([ // Must be powers of 2
    ['World', 1],
    ['Player', 2],
]);

await preloadResources();

// Core three.js components
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
    90, window.innerWidth / window.innerHeight, 0.1, 1000);
export const audioListener = new THREE.AudioListener();
camera.add(audioListener);

export const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop(() => update(clock.getDelta()));

export const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

export const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeThickness = 1;
outlinePass.visibleEdgeColor.set(0xffff00);
composer.addPass(outlinePass);

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
    runSpeed: 14,
    jumpStrength: 4,
    groundFriction: 4,
    width: 0.5,
    height: 1.2,
    footstepInterval: 8,
    cameraBob: 0.05,
    interactionReach: 1.2,
});

export const ambientLight = new THREE.AmbientLight(0xffffff, 0.001);
scene.add(ambientLight);

const map = new Maze();

const flashlight = new Flashlight({
    scale: new THREE.Vector3(0.5, 0.5, 0.5),
    position: new THREE.Vector3(0, 0.1, -2),
    rotation: new THREE.Euler(),
});

function windowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
}

function update(delta) {
    world.fixedStep();
    updateConsole();
    updateTweens(delta);

    for (const obj of updatables) obj.update(delta);
    composer.render();
}

export function addUpdatable(obj) {
    if (typeof obj?.update === 'function') {
        updatables.push(obj);
    } else {
        console.warn('GameObject invalid for updatables; no update method:', obj);
    }
}

export function removeUpdatable(obj) {
    const index = updatables.indexOf(obj);
    if (index > -1) {
        updatables.splice(index, 1);
    } else {
        //console.warn('GameObject not found in updatables:', obj);
    }
}