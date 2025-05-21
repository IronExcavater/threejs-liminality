import * as THREE from 'three';
import {GLTFLoader} from 'three/addons';

const textureLoader = new THREE.TextureLoader();
const audioLoader = new THREE.AudioLoader();
const gltfLoader = new GLTFLoader();

const textures = {}; // key: name, value: { albedo, normal, roughness }
const materials = {}; // key: name, value: material
const sounds = {}; // key: name, value: audioBuffer
const models = {}; // key: name, value: { scene, animationClips }

sounds['step'] = [];

function loadTextureSet(name, basePath) {
    const albedo = textureLoader.load(`${basePath}_albedo.png`);
    const normal = textureLoader.load(`${basePath}_normal.png`);
    const roughness = textureLoader.load(`${basePath}_roughness.png`);

    [albedo, normal, roughness].forEach(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 4);
    });

    textures[name] = { albedo, normal, roughness };
    return textures[name];
}

function loadSound(name, paths) {
    if (!Array.isArray(paths)) paths = [paths];

    if (!sounds[name]) sounds[name] = [];
    return Promise.all(paths.map(path => {
        return new Promise((resolve, reject) => {
            audioLoader.load(path,
                buffer => {
                    sounds[name].push(buffer);
                    resolve(buffer);
                },
                undefined,
                reject
            );
        });
    }));
}

function loadModel(name, path) {
    return new Promise((resolve, reject) => {
        gltfLoader.load(path,
            gltf => {
                const model = gltf.scene || gltf.scenes[0];

                model.traverse(child => {
                    if (!child.isMesh) return;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.raycast = () => {};
                })

                models[name] = {
                    scene: model,
                    animations: gltf.animations || [],
                };
                resolve(gltf);
            },
            undefined,
            reject
        );
    });
}

export function createMaterial(name, textureSetName) {
    const tex = textures[textureSetName];
    if (!tex) {
        console.warn(`Texture set ${textureSetName} not found`);
        return null;
    }

    const material = new THREE.MeshStandardMaterial({
        map: tex.albedo,
        normalMap: tex.normal,
        roughnessMap: tex.roughness,
    });

    materials[name] = material;
    return material;
}

export function getMaterial(name) {
    return materials[name];
}

export function getTextureSet(name) {
    return textures[name];
}

export function getSound(name) {
    const group = sounds[name];
    return group[Math.floor(Math.random() * group.length)];
}

export function getModel(name) {
    const { scene, animations } = models[name];
    return {
        scene: scene.clone(true),
        animations: animations,
    };
}

export const preloadResources = (async () => {
    // Preload textures, materials, sounds
    loadTextureSet('carpet', 'assets/textures/carpet');
    loadTextureSet('ceiling', 'assets/textures/ceiling_tiles');
    loadTextureSet('wallpaper', 'assets/textures/wallpaper');
    loadTextureSet('paint', 'assets/textures/paint');

    createMaterial('carpet', 'carpet');
    createMaterial('ceiling', 'ceiling');
    createMaterial('wallpaper', 'wallpaper');
    createMaterial('paint', 'paint');

    await Promise.all([
        loadSound('step', [
            'assets/sounds/step1.wav',
            'assets/sounds/step2.wav',
            'assets/sounds/step3.wav',
            'assets/sounds/step4.wav',
        ]),

        loadSound('ambient', [
            'assets/sounds/ambient/ghost.wav',
            'assets/sounds/ambient/growling.wav',
            'assets/sounds/ambient/lurking.wav',
            'assets/sounds/ambient/musicBox.wav',
            'assets/sounds/ambient/scrape.wav',
            'assets/sounds/ambient/scream.wav',
            'assets/sounds/ambient/sensor.wav',
        ]),

        loadSound('alarm', 'assets/sounds/alarm.wav'),
        loadSound('riser', 'assets/sounds/riser.wav'),
        loadSound('weepingAngel', 'assets/sounds/weepingAngel.wav'),

        loadSound('doorOpen', 'assets/sounds/doorOpen.wav'),
        loadSound('doorKnock', 'assets/sounds/doorKnock.wav'),
        loadSound('powerOn', 'assets/sounds/powerOn.wav'),
        loadSound('switch', 'assets/sounds/switch.wav'),
        loadSound('flashlightClick', 'assets/sounds/flashlightClick.wav'),

        loadModel('flashlight', 'assets/models/flashlight/scene.gltf'),
        loadModel('powerSwitch', 'assets/models/power-switch/scene.gltf'),
        loadModel('exitDoor', 'assets/models/exit-door/scene.gltf'),
        loadModel('ceilingLight', 'assets/models/ceiling-light/scene.gltf'),
        loadModel('weepingAngel', 'assets/models/weeping-angel/scene.gltf'),
    ]);
});