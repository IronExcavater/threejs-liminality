import * as THREE from 'three';
import {randomRange} from './utils.js';
import {getMaterial} from './resources.js';
import {BoxObject, PlaneObject} from './GameObject.js';
import { Heap } from 'heap-js'

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    key() {
        return `${this.x},${this.y}`;
    }

    static manhattan(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    static toKey(x, y) {
        return `${x},${y}`;
    }

    static fromKey(key) {
        const [x, y] = key.split(',').map(Number);
        return new Cell(x, y);
    }
}

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

            wallHeight: 2,
            ...config,
        }

        this.entities = new Map(); // key: type, value: array of {x, y, attachDir}
        this.paths = new Map(); // key: cell.key() => string, value: cell

        this.grid = new Map();

        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                this.setCell(x, y, true);
            }
        }

        console.log(this.grid);

        this.printGrid();

        this.generateWalls();
        this.generateRooms();
        this.clearStartingArea();
        this.generateBorderWalls();

        this.printGrid();

        this.generateEntities(2, 10, 100); // exits
        this.generateEntities(3, 30, 50); // power breakers

        this.printGrid();

        this.entities.forEach(arr => arr.forEach(({x, y}) => this.createPath(this.origin(), new Cell(x, y))));

        this.printGrid();

        this.buildFloorCeiling();
        this.buildWalls();
    }

    getCell(x, y) {
        return this.grid.get(Cell.toKey(x, y));
    }

    setCell(x, y, value) {
        this.grid.set(Cell.toKey(x, y), value);
    }

    hasCell(x, y) {
        return this.grid.has(Cell.toKey(x, y));
    }

    getEntity(x, y) {
        for (const [type, list] of this.entities.entries()) {
            for (const entity of list) {
                if (entity.x === x && entity.y === y) {
                    return { type, ...entity }; // include type with the rest of the entity's data
                }
            }
        }
        return null;
    }

    generateWalls() {
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

                this.setCell(x, y, false);

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
                    if (Math.random() > this.config.stopCarveChance || this.getCell(mx, my)) {
                        frontier.push([nx, ny]);
                        this.setCell(mx, my, false);
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

            for (let c = y; c < y + h; c++) {
                for (let r = x; r < x + w; r++) {
                    this.setCell(r, c, false);
                }
            }
        }
    }

    clearStartingArea() {
        const origin = Math.floor(this.config.mapSize / 2);
        const halfSize = Math.floor(this.config.startingRoomSize / 2);
        for (let y = -halfSize; y <= halfSize; y++) {
            for (let x = -halfSize; x <= halfSize; x++) {
                this.setCell(origin + x, origin + y, false);
            }
        }
    }

    generateBorderWalls() {
        const s = this.config.mapSize;
        for (let i = 0; i < s; i++) {
            this.setCell(i, 0, true);
            this.setCell(i, s-1, true);
            this.setCell(0, i, true);
            this.setCell(s-1, i, true);
        }
    }

    origin() {
        const half = Math.floor(this.config.mapSize / 2);
        return new Cell(half, half);
    }

    generateEntities(type, count, spacing) {
        const origin = this.origin();
        const heap = new Heap((a, b) => Cell.manhattan(a, origin) - Cell.manhattan(b, origin));
        heap.push(origin);
        const visited = new Set([origin.key()]);

        this.entities.set(type, []);

        while (!heap.isEmpty()) {
            const cell = heap.pop();

            const placed = this.entities.get(type);
            if (placed.length >= count) break;

            const found = this.findWallCellNear(cell, 10);
            if (found) {
                placed.push(found);
                console.log(`Placed entity of type ${type} at (${found.x}, ${found.y})`);
            }
            else continue;

            for (const [dx, dy] of this.directions()) {
                const neighbor = new Cell(cell.x + dx * spacing, cell.y + dy * spacing);

                if (this.hasCell(neighbor.x, neighbor.y) && !visited.has(neighbor.key())) {
                    visited.add(neighbor.key());
                    heap.push(neighbor);
                }
            }
        }
    }

    findWallCellNear(cell, range) {
        for (let r = 0; r < 100; r++) {
            const x = Math.floor(cell.x + randomRange(-range, range));
            const y = Math.floor(cell.y + randomRange(-range, range));

            if (!this.hasCell(x, y)) continue;
            if (!this.getCell(x, y)) continue;

            for (const [dx, dy] of this.directions()) {
                const neighbor = new Cell(x + dx, y + dy);
                if (this.hasCell(neighbor.x, neighbor.y) && !this.getCell(neighbor.x, neighbor.y)) {
                    return { x: neighbor.x, y: neighbor.y, dir: [-dx, -dy]};
                }
            }
        }
        return null;
    }

    directions() {
        return [[1, 0], [-1, 0], [0, 1], [0, -1]];
    }

    createPath(source, target) {
        if (this.paths.has(target.key())) return;

        const heap = new Heap((a, b) => Cell.manhattan(a, target) - Cell.manhattan(b, target));
        const visited = new Set();

        let closest = source;
        let closestDistance = Infinity;

        for (const cell of this.paths.values()) {
            heap.push(cell);
            visited.add(cell.key());
        }
        heap.push(closest);
        visited.add(closest.key());

        let iterations = 0;

        while (closest.key() !== target.key()) {
            console.log(`following path from ${closest.key()} to ${target.key()}`);
            while (!heap.isEmpty()) {
                const cell = heap.pop();
                if (!cell) continue;

                const distance = Cell.manhattan(cell, target);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closest = cell;
                    //console.log(`New closest: ${closest.key()} (distance: ${closestDistance})`);
                }

                if (cell.key() === target.key()) break;

                for (const [dx, dy] of this.directions()) {
                    const neighbor = new Cell(cell.x + dx, cell.y + dy);

                    if (this.hasCell(neighbor.x, neighbor.y) && !this.getCell(neighbor.x, neighbor.y)) {

                        if (!this.paths.has(neighbor.key())) {
                            this.paths.set(neighbor.key(), cell);
                        }

                        if (!visited.has(neighbor.key())) {
                            heap.push(neighbor);
                            visited.add(neighbor.key());
                        }
                    }
                }
            }

            if (closestDistance <= 1) return;

            console.log(`Tunneling from ${closest.key()} to reach ${target.key()}`);
            const tunnelHeap = new Heap((a, b) => Cell.manhattan(a, target) - Cell.manhattan(b, target));
            tunnelHeap.push(closest);

            let tunnelIterations = 0;

            tunnel: while (!tunnelHeap.isEmpty()) {
                const cell = tunnelHeap.pop();
                this.setCell(cell.x, cell.y, false);

                closestDistance = Cell.manhattan(cell, target);
                closest = cell;
                //console.log(`New closest: ${closest.key()} (distance: ${closestDistance})`);

                for (const [dx, dy] of this.directions()) {
                    const neighbor = new Cell(cell.x + dx, cell.y + dy);

                    if (this.hasCell(neighbor.x, neighbor.y) &&
                        !visited.has(neighbor.key()) &&
                        this.getEntity(neighbor.x, neighbor.y) === null)
                    {
                        if (!this.getCell(neighbor.x, neighbor.y)) {
                            closestDistance = Cell.manhattan(neighbor, target);
                            closest = cell;
                            //console.log(`New closest: ${closest.key()} (distance: ${closestDistance})`);
                            break tunnel;
                        }

                        tunnelHeap.push(neighbor);
                        visited.add(neighbor.key());
                    }
                }

                tunnelIterations++;
            }

            if (closestDistance <= 1) return;
            heap.push(closest);

            iterations++;
            if (iterations > 500) return;
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
                if (!this.getCell(x, y)) continue;

                const hasOpenNeighbour =
                    x > 0 && !this.getCell(x-1, y) ||
                    x < this.config.mapSize-1 && !this.getCell(x+1, y) ||
                    y > 0 && !this.getCell(x, y-1) ||
                    y < this.config.mapSize-1 && !this.getCell(x, y+1);

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

    printGrid() {
        let output = '';
        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                const entity = this.getEntity(x, y);
                if (entity !== null) output += entity.type.toString();
                else output += (this.getCell(x, y) ? '█' : ' ');
            }
            output += '\n';
        }
        console.log(output);
    }
}

export default Maze;