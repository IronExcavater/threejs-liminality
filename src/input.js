const input = {
    keys: [],
};

document.addEventListener('keydown', e => {
    input.keys[e.code] = true;
});

document.addEventListener('keyup', e => {
    input.keys[e.code] = false;
});

function getKey(keyCode) {
    const key = input.keys[keyCode];
    return (typeof key === 'boolean') ? key : false;
}

function getKeys(keyCodes) {
    return keyCodes.some(keyCode => getKey(keyCode));
}

export { getKey, getKeys };