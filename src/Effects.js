import * as THREE from 'three';

            import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
            import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
            import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
            import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
            import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
            //import {scene, camera, renderer} from './app.js';
 /*
            const composer = new EffectComposer(renderer);

            const renderPass = new RenderPass(scene, camera);

            const bloomPass = new BloomPass(5, 4, 4, 256);
               
            
            const filmPass = new FilmPass(1, .5, 200, false);
            
            const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),scene, camera);
            outlinePass.edgeStrength = 3;
            outlinePass.edgeThickness = 1;
            outlinePass.visibleEdgeColor.set(0xffff00);
        

            export function shaderEffects(renderer, scene, camera) {

                composer.addPass(renderPass);
                composer.addPass(outlinePass);
                composer.addPass(bloomPass);
                composer.addPass(filmPass);
                
            }
*/

            export function addOutlinePass(scene, camera){
                const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),scene, camera);
                outlinePass.edgeStrength = 3;
                outlinePass.edgeThickness = 1;
                outlinePass.visibleEdgeColor.set(0xffff00);
            }

                


      
                
            



    



