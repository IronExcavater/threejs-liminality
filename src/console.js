import {getKey, setInputLayer} from './input.js';
import {ambientLight, player, debug, world, collisionFilters, wireframeRenderer, scene} from './app.js';

import '/styles/console.css';

const container = document.createElement('div');
container.id = 'console';
document.body.appendChild(container);

const log = document.createElement('div');
container.append(log);

const inputContainer = document.createElement('div');
inputContainer.id = 'console-input';
container.append(inputContainer);

const input = document.createElement('input');
input.type = 'text';
inputContainer.append(input);
input.before('~');

let showConsole = false;

export function updateConsole() {
    if (getKey('Backquote', true, 2)) {
        showConsole = !showConsole;
        setInputLayer(showConsole ? 2 : 0);
        container.style.display = showConsole ? 'flex' : 'none';
        input.value = '';
    }

    if (!showConsole) return;

    input.focus();
    if (getKey('Enter', true, 2)) {
        executeCommand(input.value);
        input.value = '';
    }
}

export function executeCommand(command) {
    log.innerHTML += '> ' + command + '<br>';

    const parts = command.trim().split(' ');
    const cmd = parts[0];
    const arg = parts[1] === 'true' ? true : parts[1] === 'false' ? false : null;

    switch (cmd.toLowerCase()) {
        case 'noclip':
            debug.noclip = arg !== null ? arg : !debug.noclip;
            world.gravity.y = debug.noclip ? 0 : -9.81;
            player.body.collisionFilterMask = debug.noclip ? 0 : collisionFilters.get('World');
            break;
        case 'wireframe':
            debug.wireframe = arg !== null ? arg : !debug.wireframe;
            scene.traverse((object) => {
                if (object.isMesh) object.material.visible = !debug.wireframe;
            });
            wireframeRenderer.wireframe(debug.wireframe);
            break;
        case 'fullbright':
            debug.fullbright = arg !== null ? arg : !debug.fullbright;
            ambientLight.intensity = debug.fullbright ? 5 : 0.001;
            break;
        case 'help':
            log.innerHTML +=
            `   &emsp;noclip [true/false]<br>
                &emsp;wireframe [true/false]<br>
                &emsp;fullbright [true/false]<br>
            `;
            break;
        default:
            log.innerHTML += `Unknown command: ${cmd}<br>`;
            break;
    }

    container.scrollTop = container.scrollHeight;
}