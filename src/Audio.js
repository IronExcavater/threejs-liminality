/*The camera already has an audiolistener you can reference anywhere in the project as it is exported from app. 
I’d prefer if you add it as separate file and then manipulate it possible relative to player 
each time you play audio to make it positional
*/

import { audioListener, player } from "./app.js";

//Positional ambient sound.
const ambientSound = new THREE.PositionalAudio(audioListener);
ambientSound.load('assets/sounds/ambient.mp3',
    function(buffer){
        ambientSound.position.set(1, 0, 0); // offset from player
        ambientSound.setBuffer(buffer);
        ambientSound.setRefDistance(20);
        ambientSound.setLoop(true);
        ambientSound.setVolume(0.5);
        ambientSound.play();
    }
//additional functions as needed.
);

player.object.add(ambientSound); //sound follows player.






// Weeping angel sound. Only when angel is moving.
const angelSound = new THREE.PositionalAudio(audioListener);
angelSound.load('assets/sounds/angel.mp3',
    function(buffer){        
        angelSound.setBuffer(buffer);
        angelSound.setRefDistance(20);
        angelSound.setLoop(true);
        angelSound.setVolume(0.5);
        angelSound.play();
    }
);


