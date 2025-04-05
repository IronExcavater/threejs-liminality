import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader();
const audioLoader = new THREE.AudioLoader();

const textures = {}; // key: name, value: { albedo, normal, roughness }
const materials = {}; // key: name, value: material
const sounds = {} // key: name, value: audioBuffer

export function loadTextureSet(name, basePath) {
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

export function loadSound(name, path) {
    return new Promise((resolve, reject) => {
        audioLoader.load(path,
            (buffer) => {
                sounds[name] = buffer;
                resolve(buffer);
            },
            undefined,
            reject
        );
    });
}

export function getMaterial(name) {
    return materials[name];
}

export function getTextureSet(name) {
    return textures[name];
}

export function getSound(name) {
    return sounds[name];
}

// Preload textures, materials, sounds
loadTextureSet('carpet', 'assets/textures/carpet');
loadTextureSet('ceiling', 'assets/textures/ceiling_tiles');
loadTextureSet('wallpaper', 'assets/textures/wallpaper');
loadTextureSet('paint', 'assets/textures/paint');

createMaterial('carpet', 'carpet');
createMaterial('ceiling', 'ceiling');
createMaterial('wallpaper', 'wallpaper');
createMaterial('paint', 'paint');