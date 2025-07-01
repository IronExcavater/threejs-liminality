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
import {fadeIn, fadeOut} from './transition.js';
import AmbientSound from './ambientSound.js';
import AmbientLighting from './ambientLighting.js';
import './utils.js';

import '/styles/app.css';
import '/styles/pause.css';

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

let isLoading = true;

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
renderer.setAnimationLoop(() => update(clock.getDelta(), isPaused));

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

export let maze = new Maze();

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

const masterGain = audioListener.context.createGain();
masterGain.connect(audioListener.context.destination);
audioListener.gain.disconnect(); // Remove default connection
audioListener.gain.connect(masterGain); // Re-route through custom gain

// Expose for fade control
export const audioMaster = masterGain;

export let weepingAngels = [];

export const ambientSound = new AmbientSound();
export const ambientLighting = new AmbientLighting();

function windowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    bloomPass.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
}

isLoading = false;
let isPaused = true;
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');
const restartButton = document.getElementById('restart-button');

let currentMenu = 'main';

const mainMenu = document.getElementById('main-menu');
const instructionsMenu = document.getElementById('instructions-menu');
const creditsMenu = document.getElementById('credits-menu');

const instructionsButton = document.getElementById('instructions-button');
const creditsButton = document.getElementById('credits-button');
const backButtons = document.querySelectorAll('.back-button');

player.lookControls.addEventListener('lock', _ => {
    isPaused = false;
    pauseMenu.classList.remove('fade-in');
    pauseMenu.classList.add('fade-out');
    ambientSound.startLoop();
    ambientLighting.startLoop();
    fadeAudio(1, 1.0);
});

player.lookControls.addEventListener('unlock', _ => {
    isPaused = true;
    pauseMenu.classList.remove('fade-out');
    pauseMenu.classList.add('fade-in');
    ambientSound.stopLoop();
    ambientLighting.stopLoop();
    fadeAudio(0, 1.0);
});

resumeButton.addEventListener('click', () => {
    if (isLoading) return;
    isLoading = true;
    pauseMenu.classList.remove('fade-in');
    pauseMenu.classList.add('fade-out');

    setTimeout(() => {
        player.lookControls.lock();
        isLoading = false;
    }, 1000);
});

restartButton.addEventListener('click', () => {
    if (isLoading) return;
    isLoading = true;
    fadeIn({
        onComplete: () => {
            reload();
            maze.update();
            setTimeout(() => {
                fadeOut({
                    onComplete: () => isLoading = false
                });
            }, 2000)
        }
    });
});

document.addEventListener('keydown', e => {
    if (isPaused && e.key === 'Escape') {
        if (currentMenu !== 'main') {
            switchMenu('main');
        }
    }
});

pauseMenu.classList.remove('hidden');

function switchMenu(to) {
    const menus = {
        main: mainMenu,
        instructions: instructionsMenu,
        credits: creditsMenu
    };

    for (const [key, el] of Object.entries(menus)) {
        if (key === to) {
            el.classList.remove('fade-out')
            el.classList.add('fade-in');
        } else {
            el.classList.remove('fade-in')
            el.classList.add('fade-out');
        }
    }

    currentMenu = to;
    const submenuContainer = document.querySelector('.submenu-container');
    if (submenuContainer) submenuContainer.scrollTop = 0;
}

switchMenu('main');

instructionsButton.addEventListener('click', () => switchMenu('instructions'));
creditsButton.addEventListener('click', () => switchMenu('credits'));
backButtons.forEach(btn => btn.addEventListener('click', () => switchMenu('main')));

function fadeAudio(toValue, duration = 1.0) {
    const now = audioListener.context.currentTime;
    audioMaster.gain.cancelScheduledValues(now);
    audioMaster.gain.setValueAtTime(audioMaster.gain.value, now);
    audioMaster.gain.linearRampToValueAtTime(toValue, now + duration);
}

update(0, false);

fadeOut({});

function update(delta, isPaused) {
    if (!isPaused) world.fixedStep();

    updateConsole();
    updateTweens(delta);
    updateSettings();

    if (!isPaused) for (const obj of updatables) obj.update(delta);
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
    console.log('reload');
    weepingAngels.forEach(weepingAngel => {
        scene.remove(weepingAngel);
        weepingAngel.dispose();
    });
    weepingAngels = [];
    player.setPosition(new THREE.Vector3(0, 0, 0));
    player.setRotation(new THREE.Vector3());
    maze.generate();
    activatedPower = 0;
}