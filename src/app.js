import * as THREE from 'three';
import {EffectComposer, FilmPass, GlitchPass, OutlinePass, RenderPass, RGBShiftShader, ShaderPass, UnrealBloomPass,
    VignetteShader} from 'three/addons';
import * as CANNON from 'cannon-es';
import Player from './Player.js';
import Maze from './Maze.js';
import CannonDebugRenderer from './CannonDebugRenderer.js';
import {updateTweens} from './tween.js';
import {updateConsole} from './console.js';
import Flashlight from './Flashlight.js';
import WeepingAngel from './WeepingAngel.js';
import {preloadResources} from './resources.js';
import {fadeOut} from './transition.js';
import AmbientSound from './ambientSound.js';
import AmbientLighting from './ambientLighting.js';
import './utils.js';

import '/styles/app.css';

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
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop(() => update(clock.getDelta()));

export const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);

export const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeThickness = 1;
outlinePass.visibleEdgeColor.set(0xffff00);

const filmPass = new FilmPass(1, false);

export const glitchPass = new GlitchPass();

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3, 0.5, 0.85);

const rgbPass = new ShaderPass(RGBShiftShader);
rgbPass.uniforms['amount'].value = 0.001;

const vignettePass = new ShaderPass(VignetteShader);

export const passOrder = [bloomPass, filmPass, rgbPass, outlinePass, glitchPass, vignettePass];

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(filmPass);
composer.addPass(rgbPass);
composer.addPass(outlinePass);
composer.addPass(glitchPass);


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
    postprocessing: true,
    fog: true,
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

export const settings = {
    renderDistance: 4,
    maxNumLights: 10,
};

export const fog = new THREE.Fog(0x000000);
scene.fog = fog;

export const ambientLight = new THREE.AmbientLight(0xffffff, 0.001);
scene.add(ambientLight);

await renderer.compileAsync(scene, camera);

export const maze = new Maze();

let activatedPower = 0;

export const escapePower = 5;

export function increasePower() {
    activatedPower++;
    if (activatedPower === escapePower) ambientSound.playGlobalSound('alarm');

    if (activatedPower > escapePower) return;
    weepingAngels.push(new WeepingAngel({
        position: new THREE.Vector3(0, 0.75, 10000),
    }));
}

export function getPower() {
    return activatedPower;
}

export function canEscape() {
    return activatedPower >= escapePower;
}

const flashlight = new Flashlight({
    position: new THREE.Vector3(0, 0.05, -2),
    rotation: new THREE.Euler(),
});

let weepingAngels = [];
fadeOut({});

export const ambientSound = new AmbientSound();
ambientSound.startLoop();

export const ambientLighting = new AmbientLighting();
ambientLighting.startLoop();

function windowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    bloomPass.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
}

function update(delta) {
    world.fixedStep();
    updateConsole();
    updateTweens(delta);
    updateSettings();

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

function updateSettings() {
    fog.far = (settings.renderDistance / 2) * maze.config.chunkSize * maze.config.cellSize;
}

export function reload() {
    weepingAngels.forEach(weepingAngel => {
        scene.remove(weepingAngel);
        weepingAngel.dispose();
    });
    weepingAngels = [];
    player.setPosition(new THREE.Vector3(0, 0, 0));
    player.setRotation(new THREE.Vector3());
    fadeOut({});
}