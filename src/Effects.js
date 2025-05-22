import * as THREE from 'three';

            import {EffectComposer, UnrealBloomPass, OutlinePass, RenderPass, GlitchPass, ShaderPass, FilmPass} from 'three/addons';
            import { RGBShiftShader, VignetteShader} from 'three/addons';
    
    
            export function addRenderPass(scene, camera) {
                return new RenderPass(scene, camera);
            }

            export function addFilmPass() {
                return new FilmPass(1, false);
            }

            export function addGlitchPass() {
                return new GlitchPass();
            }

            export function addBloomPass(window) {
                return new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), .3, .5, 0.85);    
            }

            export function addRGBShift() {
                 return new ShaderPass(RGBShiftShader);
            }

            export function addVignette() {
                return new ShaderPass(VignetteShader);
            }

            export function addOutlinePass(scene, camera){
                const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),scene, camera);
                outlinePass.edgeStrength = 3;
                outlinePass.edgeThickness = 1;
                outlinePass.visibleEdgeColor.set(0xffff00);

                return outlinePass;
            }

            export function turnOffGlitch (glitchPass) {
                setTimeout(() =>  {glitchPass.enabled = false;}, 2000);
            }

           
                


      
                
            



    



