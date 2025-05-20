/*The camera already has an audiolistener you can reference anywhere in the project as it is exported from app. 
I’d prefer if you add it as separate file and then manipulate it possible relative to player 
each time you play audio to make it positional
*/

import { audioListener } from "./app.js";

//Ambient sound
const ambientSound = new THREE.PositionalAudio(audioListener);
ambientSound.load('assets/sounds/ambient.mp3',
    function(buffer){
        ambientSound.setBuffer(buffer);
        ambientSound.setRefDistance(20);
        //ambientSound.setLoop(true);
        ambientSound.setVolume(0.5);
        ambientSound.play();
    }
//additional functions as needed.
);

player.object.add(ambientSound);






// Weeping angel sound