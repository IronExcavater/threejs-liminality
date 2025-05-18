import * as THREE from 'three';

            import {EffectComposer, OutlinePass, FilmPass, BloomPass, RenderPass} from 'three/addons';
            import {scene, camera, renderer} from './app.js';


            export const composer = new EffectComposer(renderer);

            export const renderPass = new RenderPass(scene, camera);

            export const bloomPass = new BloomPass(5, 4, 4, 256);
               
            
            export const filmPass = new FilmPass(1, .5, 200, false);
            
            export const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),scene, camera);
                outlinePass.edgeStrength = 3;
                outlinePass.edgeThickness = 1;
                outlinePass.visibleEdgeColor.set(0xffff00);

      
                
            



    



