import * as THREE from 'three';
import {randomRange} from './utils.js';
import {getMaterial, getModel} from './resources.js';
import {BoxObject, ModelObject, PlaneObject} from './GameObject.js';
import {addUpdatable, player, world} from './app.js';
import {Tween} from "./tween.js";

class Maze {
    constructor(config = {}) {
        this.config = {
            mapSize: 100, // World unit size
            cellSize: 2,

            mazeFillRatio: 0.8,
            mazeIterations: 1000,
            stopCarveChance: 0.5,

            startingRoomSize: 4,

            numRooms: 2,
            roomSizeRange: [1, 32],

            numPillarRooms: 1,
            pillarRoomSizeRange: [1, 32],
            pillarSpacingRange: [2, 6],

            numCustomRooms: 1,
            customRoomSides: [3, 8],
            customRoomRadius: [1, 16],

            wallHeight: 2,
            ...config,
        }

        this.grid = Array(this.config.mapSize).fill().map(() => Array(this.config.mapSize).fill(true));
        console.log(this.grid);

        this.generate();
    }

    generate() {
        this.generateMaze();
        this.generateRooms();
        this.generateBorderWalls();
        this.clearStartingArea();

        this.buildFloorCeiling();
        this.buildWalls();
        this.buildStartingArea();
    }

    generateMaze() {
        const visited = new Set();

        for (let i = 0; i < this.config.mazeIterations; i++) {
            let x = Math.floor(Math.random() * this.config.mapSize);
            let y = Math.floor(Math.random() * this.config.mapSize);

            visited.add([x, y]);
            let frontier = [[x, y]];

            while (visited.size / (this.config.mapSize * this.config.mapSize) < this.config.mazeFillRatio) {
                if (frontier.length === 0) break;

                const idx = Math.floor(Math.random() * frontier.length);
                [x, y] = frontier.splice(idx, 1)[0];
                visited.add([x, y]);

                this.grid[y][x] = false;

                let neighbours = [];
                if (x > 1 && !visited.has([x-2, y]))
                    neighbours.push([x-2, y]);
                if (x < this.config.mapSize-2 && !visited.has([x+2, y]))
                    neighbours.push([x+2, y]);
                if (y > 1 && !visited.has([x, y-2]))
                    neighbours.push([x, y-2]);
                if (y < this.config.mapSize-2 && !visited.has([x, y+2]))
                    neighbours.push([x, y+2]);

                if (neighbours.length > 0) {
                    let [nx, ny] = neighbours[Math.floor(Math.random() * neighbours.length)];

                    // Carve path between cells
                    const mx = Math.floor((x + nx) / 2), my = Math.floor((y + ny) / 2);
                    if (Math.random() > this.config.stopCarveChance || this.grid[my][mx]) {
                        frontier.push([nx, ny]);
                        this.grid[my][mx] = false;
                    }
                }
            }
        }
    }

    generateRooms() {
        const { numRooms, roomSizeRange } = this.config;
        for (let i = 0; i < numRooms; i++) {
            const w = randomRange(...roomSizeRange);
            const h = randomRange(...roomSizeRange);
            const x = randomRange(0, this.config.mapSize - w);
            const y = randomRange(0, this.config.mapSize - h);

            for (let r = y; r < y + h; r++) {
                for (let c = x; c < x + w; c++) {
                    this.grid[r][c] = false;
                }
            }
        }
    }

    clearStartingArea() {
        const origin = Math.floor(this.config.mapSize / 2);
        const halfSize = Math.floor(this.config.startingRoomSize / 2);
        for (let y = -halfSize; y <= halfSize; y++) {
            for (let x = -halfSize; x <= halfSize; x++) {
                this.grid[origin + y][origin + x] = false;
            }
        }
    }

    generateBorderWalls() {
        const s = this.config.mapSize;
        for (let i = 0; i < s; i++) {
            this.grid[0][i] = true;
            this.grid[s - 1][i] = true;
            this.grid[i][0] = true;
            this.grid[i][s - 1] = true;
        }
    }

    buildFloorCeiling() {
        const scale = new THREE.Vector2(
            this.config.mapSize * this.config.cellSize,
            this.config.mapSize * this.config.cellSize);

        new PlaneObject({
            material: getMaterial('carpet'),
            scale: scale,
            position: THREE.Vector3.zero,
            rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        });

        new PlaneObject({
            material: getMaterial('ceiling'),
            scale: scale,
            position: new THREE.Vector3(0, this.config.wallHeight, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
        });
    }

    buildWalls() {
        const origin = this.config.mapSize / 2 * this.config.cellSize;

        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                if (!this.grid[y][x]) continue;

                const hasOpenNeighbour =
                    x > 0 && !this.grid[y][x-1] ||
                    x < this.config.mapSize-1 && !this.grid[y][x+1] ||
                    y > 0 && !this.grid[y-1][x] ||
                    y < this.config.mapSize-1 && !this.grid[y+1][x];

                if (!hasOpenNeighbour) continue;

                const wall = new BoxObject({
                    scale: new THREE.Vector3(this.config.cellSize, this.config.wallHeight, this.config.cellSize),
                    material: getMaterial('wallpaper'),
                    position: new THREE.Vector3(
                        x * this.config.cellSize - origin,
                        this.config.wallHeight / 2,
                        y * this.config.cellSize - origin,
                    )
                });
            }
        }
    }

    buildStartingArea() {
        const flashlight = new ModelObject({
            model: getModel('flashlight').scene,
            scale: new THREE.Vector3(0.5, 0.5, 0.5),
            position: new THREE.Vector3(0, 0.1, -2),
            interactRadius: 0.4,
            interactCallback: (player) => {
                if (player.hasFlashlight) return;
                player.hasFlashlight = true;

                world.removeBody(flashlight.body);
                flashlight.canInteract = false;

                new Tween({
                    setter: position => flashlight.position.copy(position),
                    startValue: flashlight.position.clone(),
                    endValue: () => player.flashlight.position.clone(),
                    duration: 1,
                    onComplete: () => {
                        flashlight.update = () => {
                            flashlight.position.copy(player.flashlight.position);
                            const targetPos = player.flashlight.target.getWorldPosition(new THREE.Vector3());
                            flashlight.lookAt(targetPos);
                        }
                        addUpdatable(flashlight);
                    },
                });

                new Tween({
                    setter: quaternion => flashlight.quaternion.copy(quaternion),
                    startValue: flashlight.quaternion.clone(),
                    endValue: () => {
                        const euler = new THREE.Euler().setFromQuaternion(player.flashlight.quaternion);
                        euler.y += Math.PI;
                        return new THREE.Quaternion().setFromEuler(euler);
                    },
                    duration: 1,
                });
            },
        });
    }

    printGrid() {
        let output = '';
        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                output += this.grid[y][x] ? '█' : ' ';
            }
            output += '\n';
        }
        console.log(output);
    }
}

export default Maze;