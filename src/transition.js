import { Tween } from './tween.js';

import '/styles/transition.css';

const transition = document.createElement('div');
transition.id = 'transition';
document.body.appendChild(transition);

let currentAlpha = 1;

function setAlpha(alpha) {
    currentAlpha = alpha;
    transition.style.opacity = alpha.toString();
}

export function fadeIn({
    duration = 1,
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
}

export function fadeOut({
    duration = 1,
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
    })
}