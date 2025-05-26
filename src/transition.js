import { Tween } from './tween.js';

import '/styles/transition.css';
import {glitchPass} from "./app.js";

const transition = document.createElement('div');
transition.id = 'transition';
document.body.appendChild(transition);

let currentAlpha = 1;

function setAlpha(alpha) {
    currentAlpha = alpha;
    transition.style.opacity = alpha.toString();
}

export function fadeIn({
    duration = 2,
    text = '',
    onComplete = () => {}
}) {
    transition.innerText = text;
    new Tween({
        setter: setAlpha,
        startValue: currentAlpha,
        endValue: 1,
        duration,
        onComplete
    });
    setTimeout(() => glitchPass.enabled = true, 2000);
}

export function fadeOut({
    duration = 2,
    onComplete = () => {}
}) {
    new Tween({
        setter: setAlpha,
        startValue: currentAlpha,
        endValue: 0,
        duration,
        onComplete: () => {
            transition.innerText = '';
            onComplete();
        }
    });
    setTimeout(() => glitchPass.enabled = false, 2000);
}