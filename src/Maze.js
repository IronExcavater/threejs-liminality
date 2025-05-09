import * as THREE from 'three';
import {randomRange} from './utils.js';
import {getMaterial} from './resources.js';
import {BoxObject, PlaneObject} from './GameObject.js';

class Maze {
    constructor(config = {}) {
        this.config = {
            mapSize: 100, // World unit size
            cellSize: 2,

            mazeFillRatio: 0.8,
            mazeIterations: 1000,
            stopCarveChance: 0.5,

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

        this.buildFloorCeiling();
        this.buildWalls();
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

    buildFloorCeiling() {
        new PlaneObject({
            material: getMaterial('carpet'),
            scale: new THREE.Vector2(this.config.mapSize, this.config.mapSize),
            position: THREE.Vector3.zero,
            rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
        });

        new PlaneObject({
            material: getMaterial('ceiling'),
            scale: new THREE.Vector2(this.config.mapSize, this.config.mapSize),
            position: new THREE.Vector3(0, this.config.wallHeight, 0),
            rotation: new THREE.Euler(Math.PI / 2, 0, 0),
        });
    }

    buildWalls() {
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
                        x * this.config.cellSize - this.config.mapSize / 2 + this.config.cellSize / 2,
                        this.config.wallHeight / 2,
                        y * this.config.cellSize - this.config.mapSize / 2 + this.config.cellSize / 2,
                    )
                });
            }
        }
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