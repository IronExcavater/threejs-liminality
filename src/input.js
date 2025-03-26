const input = {
    keys: [],
};

document.addEventListener('keydown', e => {
    input.keys[e.code] = true;
});

document.addEventListener('keyup', e => {
    input.keys[e.code] = false;
});

function getKey(keyCode, consume = false) {
    const key = input.keys[keyCode];
    if (consume) input.keys[keyCode] = false;
    return (typeof key === 'boolean') ? key : false;
}

function getKeys(keyCodes, consume = false) {
    return keyCodes.some(keyCode => getKey(keyCode, consume));
}

export { getKey, getKeys };