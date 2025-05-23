import {getKey, setInputLayer} from './input.js';
import {ambientLight, player, debug, world, collisionFilters, wireframeRenderer, scene, composer, fog,
    passOrder} from './app.js';

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
            ambientLight.intensity = debug.fullbright ? 1 : 0.001;
            break;
        case 'postprocessing':
            debug.postprocessing = arg !== null ? arg : !debug.postprocessing;
            if (debug.postprocessing) {
                for (let i = 0; i < passOrder.length; i++) {
                    composer.addPass(passOrder[i]);
                }
            } else {
                for (let i = passOrder.length - 1; i >= 0; i--) {
                    composer.removePass(passOrder[i]);
                }
            }
            break;
        case 'fog':
            debug.fog = arg !== null ? arg : !debug.fog;
            scene.fog = debug.fog ? fog : null;
            break;
        case 'help':
            log.innerHTML +=
            `   &emsp;noclip [true/false]<br>
                &emsp;wireframe [true/false]<br>
                &emsp;fullbright [true/false]<br>
                &emsp;postprocessing [true/false]<br>
                &emsp;fog [true/false]<br>
            `;
            break;
        default:
            log.innerHTML += `Unknown command: ${cmd}<br>`;
            break;
    }

    container.scrollTop = container.scrollHeight;
}