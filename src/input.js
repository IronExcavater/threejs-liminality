const input = {
    keys: [],
};

let activeLayer = 0;

document.addEventListener('keydown', e => {
    input.keys[e.code] = true;
});

document.addEventListener('keyup', e => {
    input.keys[e.code] = false;
});

export function getKey(keyCode, consume = false, layer = 0) {
    if (layer < activeLayer) return false;
    const key = input.keys[keyCode];
    if (consume) input.keys[keyCode] = false;
    return (typeof key === 'boolean') ? key : false;
}

export function getKeys(keyCodes, consume = false) {
    return keyCodes.some(keyCode => getKey(keyCode, consume));
}

export function setInputLayer(layer) {
    activeLayer = layer;
}