import * as THREE from 'three';

			import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js';

            class Effects{

                constructor(renderer, width, height) {
                this.effect = new AnaglyphEffect(renderer);
                this.effect.setSize(width, height);
                }

                resize(width, height) {
                    this.effect.setSize(width, height);
                }
            }

            class RendererManagr {
                constructor(effect) {
                    this.effect = effect;
                }

                render(scene, camera) {
                    this.effect.render(scene, camera);
                }
            }

