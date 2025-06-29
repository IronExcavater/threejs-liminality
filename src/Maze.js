import * as THREE from 'three';
import {randomRange} from './utils.js';
import {getMaterial} from './resources.js';
import {BoxObject, PlaneObject} from './GameObject.js';
import {addUpdatable, player, settings} from './app.js';
import { Heap } from 'heap-js'
import PowerSwitch from './PowerSwitch.js';
import ExitDoor from './ExitDoor.js';
import CeilingLight from './CeilingLight.js';
import Furniture from './Furniture.js';

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
            mazeIterations: 50, // * mapSize
            stopCarveChance: 0.5,

            startingRoomSize: 4,

            numRooms: 10, // per 100 cells
            roomAreaRange: [50, 100],

            numPillarRooms: 1, // per 100 cells
            pillarRoomAreaRange: [1, 32],
            pillarSpacingRange: [2, 6],

            wallHeight: 2,

            chunkRadius: 4,
            chunkSize: 3,
            cullRadius: 6,
            ...config,
        }

        this.entities = new Map(); // key: type, value: array of {x, y, attachDir}
        this.paths = new Map(); // key: Cell.key() => string, value: cell

        this.grid = new Map(); // key: Cell.key() => string, value: true/false (true=wall)

        this.ceilingLights = new Map(); // key: closest power switch entity => Cell.key(), value: CeilingLight cell => Cell

        this.entityTypes = new Map([
            ['ceilingLight', 1],
            ['exitDoor', 2],
            ['powerSwitch', 3],
            ['furniture', 4], // NEW CODE
        ]);

        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                this.setCell(x, y, true);
            }
        }

        this.chunks = new Map(); // key: Cell.key() => string, value: array of data (x, y, w, h, type) with type = box, model, etc. and model type also with data to the model name.
        this.instantiated = new Map(); // key: Cell.key() => string, value: array of gameObjects

        this.generate();

        addUpdatable(this);
    }

    generate() {
        for (const objs of this.instantiated.values()) {
            objs.forEach(obj => obj.dispose());
        }

        this.entities = new Map(); // key: type, value: array of {x, y, attachDir}
        this.paths = new Map(); // key: Cell.key() => string, value: cell

        this.grid = new Map(); // key: Cell.key() => string, value: true/false (true=wall)

        this.ceilingLights = new Map(); // key: closest power switch entity => Cell.key(), value: CeilingLight cell => Cell

        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                this.setCell(x, y, true);
            }
        }

        this.chunks = new Map(); // key: Cell.key() => string, value: array of data (x, y, w, h, type) with type = box, model, etc. and model type also with data to the model name.
        this.instantiated = new Map(); // key: Cell.key() => string, value: array of gameObjects

        this.generateWalls();
        this.generateRooms();
        this.clearStartingArea();
        this.generateBorderWalls();

        this.generateEntities(this.entityTypes.get('exitDoor'), 30, 30, 10);
        this.generateEntities(this.entityTypes.get('powerSwitch'), 250, 10, 10);
        this.generateEntities(this.entityTypes.get('furniture'), 500, 5, 1, {onWall: false}); // NEW CODE

        this.entities.forEach(arr => arr.forEach(({cell}) => this.createPath(this.origin(), cell)));

        this.generateEntities(this.entityTypes.get('ceilingLight'), 1000, 5, 1, {onWall: false});
        // this.generateCeilingLights(this.entityTypes.get('ceilingLight'), this.entityTypes.get('powerSwitch'), 5);

        this.printGrid();

        this.buildFloorCeiling();
        
        this.buildWalls();
        this.buildEntities(this.entityTypes.get('ceilingLight'), 0, 0.98);
        this.buildEntities(this.entityTypes.get('exitDoor'), 0.04, -0.25);
        this.buildEntities(this.entityTypes.get('powerSwitch'), 0.05, 0);

        this.bindEntities();
       // this.buildTestFurniture(); works. Now to integrate random spawning of furniture // NEW CODE

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
                if (entity.cell.x === x && entity.cell.y === y) {
                    return { type, ...entity }; // include type with the rest of the entity's data
                }
            }
        }
        return null;
    }

    worldToChunk(x, z) {
        let cx = Math.floor((x + this.worldOrigin().x) / (this.config.chunkSize * this.config.cellSize));
        if (isNaN(cx)) cx = 0;
        let cy = Math.floor((z + this.worldOrigin().y) / (this.config.chunkSize * this.config.cellSize));
        if (isNaN(cy)) cy = 0;
        return new Cell(cx, cy);
    }

    gridToChunk(x, y) {
        const chunkX = Math.floor(x / this.config.chunkSize);
        const chunkY = Math.floor(y / this.config.chunkSize);
        return new Cell(chunkX, chunkY);
    }

    getChunk(x, y) {
        if (!this.chunks.has(Cell.toKey(x, y))) this.chunks.set(Cell.toKey(x, y), []);
        return this.chunks.get(Cell.toKey(x, y));
    }

    generateWalls() {
        const visited = new Set();

        for (let i = 0; i < this.config.mazeIterations * this.config.mapSize; i++) {
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
        const { numRooms, roomAreaRange } = this.config;
        for (let i = 0; i < numRooms * this.config.mapSize / 100; i++) {
            const size = randomRange(...roomAreaRange);
            const w = randomRange(1, size/2);
            const h = size / w;
            const x = randomRange(0, this.config.mapSize - w);
            const y = randomRange(0, this.config.mapSize - h);
            console.log(`Created room of size (${w},${h}) at ()${x},${y})`);

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

    // the origin in 'cell' space. Used for matrices
    origin() {
        const half = Math.floor(this.config.mapSize / 2);
        return new Cell(half, half);
    }

    // The origin in world space. Returns {x, y}
    worldOrigin() {
        const x = this.origin().x * this.config.cellSize;
        const y = this.origin().y * this.config.cellSize;
        return new Cell(x, y);
    }

    generateCeilingLights(type, powerSwitchType, spacing) {
        const origin = this.origin();
        const heap = new Heap((a, b) => Cell.manhattan(a, origin) - Cell.manhattan(b, origin));
        heap.push(origin);
        const visited = new Set([origin.key()]);

        this.entities.set(type, []);
        const ceilingLights = this.entities.get(type);

        const powerSwitches = this.entities.get(powerSwitchType);
        this.ceilingLights.clear();

        while (!heap.isEmpty()) {
            const cell = heap.pop();

            if (!this.hasCell(cell.x, cell.y)) continue;
            if (this.getCell(cell.x, cell.y)) continue;

            let closestPowerSwitch = new Cell(0, 0);
            let closestDistance = Number.MAX_VALUE;
            for (const powerSwitch of powerSwitches) {
                const powerSwitchCell = new Cell(powerSwitch.x, powerSwitch.y);
                const distance = Cell.manhattan(cell, powerSwitchCell);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPowerSwitch = powerSwitchCell;
                }
            }

            let list = this.ceilingLights.has(closestPowerSwitch.key())
                ? this.ceilingLights.get(closestPowerSwitch.key())
                : this.ceilingLights.set(closestPowerSwitch.key(), []).get(closestPowerSwitch.key());


            ceilingLights.push({ x: cell.x, y: cell.y, dir: [0, 0]});

            list.push(cell);

            for (const [dx, dy] of this.directions()) {
                const neighbor = new Cell(cell.x + dx * spacing, cell.y + dy * spacing);

                if (this.hasCell(neighbor.x, neighbor.y) && !visited.has(neighbor.key())) {
                    visited.add(neighbor.key());
                    heap.push(neighbor);
                }
            }
        }
        console.log('placed ceiling lights: ', ceilingLights);
    }

    generateEntities(type, count, spacing, tolerance, cellConditions = {onWall: true}) {
        const origin = this.origin();
        const heap = new Heap((a, b) => Cell.manhattan(a, origin) - Cell.manhattan(b, origin));
        heap.push(origin);
        const visited = new Set([origin.key()]);

        this.entities.set(type, []);
        const furnitureModels = [ // NEW CODE
            'chair_031',
            'chair_030',
            'table_016',
            'bookCaseV2_004',
            'bookCaseV2_005',
            'bookCaseV2_006'
        ];

        while (!heap.isEmpty()) {
            const cell = heap.pop();

            const placed = this.entities.get(type);
            if (placed.length >= count) break;

            const found = this.findCellNear(cell, tolerance, cellConditions);
            if (found) {
                // Special logic for furniture // NEW CODE
                if (type === this.entityTypes.get('furniture')) {
                    const modelName = furnitureModels[Math.floor(Math.random() * furnitureModels.length)];
                    let posY = (modelName.startsWith('chair')) ? 0.4 : 0.5;
                    let rotY = Math.random() * Math.PI * 2;
                    placed.push({
                        ...found,
                        modelName,
                        posY,
                        rotY
                    });
                    console.log(`Placed entity of type ${type} (${modelName}) at (${found.cell.x}, ${found.cell.y})`);

                } else {
                    placed.push(found);
                    console.log(`Placed entity of type ${type} at (${found.cell.x}, ${found.cell.y})`);
                }
            } else continue;

            for (const [dx, dy] of this.directions()) {
                const neighbor = new Cell(cell.x + dx * spacing, cell.y + dy * spacing);

                if (this.hasCell(neighbor.x, neighbor.y) && !visited.has(neighbor.key())) {
                    visited.add(neighbor.key());
                    heap.push(neighbor);
                }
            }
        }
    }

    findCellNear(cell, tolerance, cellConditions = {onWall: true}) {
        for (let r = 0; r < 100; r++) {
            const x = r === 0 ? cell.x : Math.floor(cell.x + randomRange(-tolerance, tolerance));
            const y = r === 0 ? cell.y :Math.floor(cell.y + randomRange(-tolerance, tolerance));

            if (!this.hasCell(x, y)) continue;

            if (cellConditions.onWall) {
                if (!this.getCell(x, y)) continue;
                for (const [dx, dy] of this.directions()) {
                    const neighbor = new Cell(x + dx, y + dy);
                    if (this.hasCell(neighbor.x, neighbor.y) &&
                        !this.getCell(neighbor.x, neighbor.y) &&
                        !this.getEntity(neighbor.x, neighbor.y))
                    {
                        return { cell: neighbor, dir: [-dx, -dy]};
                    }
                }
            } else {
                if (this.getCell(x, y)) continue;
                return { cell: new Cell(x, y), dir: [0, 0]};
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

                for (const [dx, dy] of this.directions()) {
                    const neighbor = new Cell(cell.x + dx, cell.y + dy);

                    if (this.hasCell(neighbor.x, neighbor.y) &&
                        !visited.has(neighbor.key()) &&
                        this.getEntity(neighbor.x, neighbor.y) === null)
                    {
                        if (!this.getCell(neighbor.x, neighbor.y)) {
                            closestDistance = Cell.manhattan(neighbor, target);
                            closest = cell;
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

    loadChunksAround(playerX, playerY) {
        const chunkOrigin = this.worldToChunk(playerX, playerY);
        const radius = settings.renderDistance / this.config.cellSize;

        const activeChunks = new Set();

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const chunk = new Cell(chunkOrigin.x + dx, chunkOrigin.y + dy);
                activeChunks.add(chunk.key());

                if (this.instantiated.has(chunk.key())) {
                    for (const obj of this.instantiated.get(chunk.key())) {
                        obj.hide(false);
                    }
                } else {
                    this.instantiated.set(chunk.key(), []);
                    const chunkData = this.getChunk(chunk.x, chunk.y);

                    for (const item of chunkData) {
                        let obj = null;

                        if (item.type === 'box') {
                            obj = new BoxObject({
                                scale: new THREE.Vector3(item.w, item.h, item.d),
                                material: getMaterial(item.material),
                                position: new THREE.Vector3(item.x, item.y, item.z)
                            });
                        }
                        else if (item.type === 'entity') {
                            const pos = new THREE.Vector3(item.x, item.y, item.z);
                            const rot = new THREE.Euler(0, item.rot, 0);

                            if (this.entityTypes.get('exitDoor') === item.entityType) {
                                obj = new ExitDoor({
                                    cell: item.cell, position: pos, rotation: rot
                                });

                            } else if (this.entityTypes.get('powerSwitch') === item.entityType) {
                                obj = new PowerSwitch({
                                    cell: item.cell, position: pos, rotation: rot, state: item.state
                                });

                            } else if (this.entityTypes.get('ceilingLight') === item.entityType) {

                                let state = item.state;
                                if (!item.state) {
                                    for (const powerSwitch of item.powerSwitches) {
                                        if (powerSwitch.state) {
                                            state = true;
                                            break;
                                        }
                                    }
                                }
                                obj = new CeilingLight({
                                    cell: item.cell, position: pos, rotation: rot, state: item.state
                                });
                            } else if (this.entityTypes.get('furniture') === item.entityType) {
                                const pos = new THREE.Vector3(item.x, item.y, item.z);
                                const rot = new THREE.Euler(0, item.rot, 0);
                                obj = new Furniture({
                                    cell: item.cell,
                                    modelName: item.modelName,
                                    position: pos,
                                    scale: new THREE.Vector3(1.2, 1.2, 1.2),
                                    rotation: rot
                                });
                            }
                        }

                        if (obj) this.instantiated.get(chunk.key()).push(obj);
                    }
                }
            }
        }

        // Hide all non-active chunks within cullRadius otherwise destroy
        for (const [key, objs] of this.instantiated.entries()) {
            const chunk = Cell.fromKey(key);
            const dx = chunk.x - chunkOrigin.x;
            const dy = chunk.y - chunkOrigin.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > this.config.cullRadius * this.config.cullRadius) {
                // Cull chunk completely
                for (const obj of objs) {
                    obj?.dispose();
                }
                this.instantiated.delete(key);
            } else if (!activeChunks.has(key)) {
                // Still within cull radius, just hide
                for (const obj of objs) {
                    obj.hide(true);
                }
            }
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

    // buildTestFurniture() {
    //     // Generate furniture // NEW CODE
    //     const furnitureModels = [
    //         'chair_031',
    //         'chair_030',
    //         'table_016',
    //         'bookCaseV2_004',
    //         'bookCaseV2_005',
    //         'bookCaseV2_006'
    //     ];

    //     const origin = this.origin();
    //     const worldOrigin = this.worldOrigin();
    //     const spacing = 3; // space between each furniture

    //     furnitureModels.forEach((modelName, i) => {

    //         let y = (modelName.startsWith('table')) ? 0.4 : 0.6;

    //         const pos = new THREE.Vector3(
    //             (origin.x + (i - 2) * spacing) * this.config.cellSize - worldOrigin.x,
    //             y, // test raise above floor
    //             origin.y * this.config.cellSize - worldOrigin.y
    //         );
    //         new Furniture({
    //             cell: new Cell(origin.x + (i - 2) * spacing, origin.y),
    //             modelName,
    //             position: pos, // raise above floor
    //             scale: new THREE.Vector3(1,1,1),
    //             rotation: new THREE.Euler(0, 0, 0)
    //         });
    //         // Optionally, add to a list or scene if needed
    //     });
    //     // --- END TEST ---
    // }

    buildWalls() {
        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                if (!this.getCell(x, y)) continue;

                const hasOpenNeighbour =
                    x > 0 && !this.getCell(x-1, y) ||
                    x < this.config.mapSize-1 && !this.getCell(x+1, y) ||
                    y > 0 && !this.getCell(x, y-1) ||
                    y < this.config.mapSize-1 && !this.getCell(x, y+1);

                if (!hasOpenNeighbour) continue;

                const chunk = this.gridToChunk(x, y);

                this.getChunk(chunk.x, chunk.y).push({
                    type: 'box',
                    x: x * this.config.cellSize - this.worldOrigin().x,
                    y: this.config.wallHeight / 2,
                    z: y * this.config.cellSize - this.worldOrigin().y,
                    w: this.config.cellSize,
                    h: this.config.wallHeight,
                    d: this.config.cellSize,
                    material: 'wallpaper'
                });
            }
        }
    }

    buildEntities(type, directionOffset = 0, yPositionOffset = 0) {
        for (const entity of this.entities.get(type)) {
            const cell = entity.cell;
            const chunk = this.gridToChunk(cell.x, cell.y);
            const worldOrigin = this.worldOrigin();

            if (type === this.entityTypes.get('furniture')) {
                // Use stored modelName, posY, rotY
                this.getChunk(chunk.x, chunk.y).push({
                    type: 'furniture',
                    entityType: type,
                    cell: cell,
                    modelName: entity.modelName,
                    y: entity.posY,
                    x: cell.x * this.config.cellSize - worldOrigin.x,
                    z: cell.y * this.config.cellSize - worldOrigin.y,
                    rot: entity.rotY,
                });
            } else {
                // ...existing code for other entity types...
                const baseX = cell.x * this.config.cellSize - worldOrigin.x;
                const baseZ = cell.y * this.config.cellSize - worldOrigin.y;
                const dx = entity.dir[0] * (this.config.cellSize / 2 - directionOffset);
                const dz = entity.dir[1] * (this.config.cellSize / 2 - directionOffset);

                let state = false;
                if (type === this.entityTypes.get('ceilingLight')) {
                    if (Cell.manhattan(cell, this.origin()) < 10) {
                        state = true;
                    }
                }

                this.getChunk(chunk.x, chunk.y).push({
                    type: 'entity',
                    entityType: type,
                    state: state,
                    cell: cell,
                    x: baseX + dx,
                    y: this.config.wallHeight / 2 + yPositionOffset,
                    z: baseZ + dz,
                    rot: Math.atan2(entity.dir[0], entity.dir[1]),
                });
            }
        }
    }

    bindEntities() {
        for (const [ chunkKey, items ] of this.chunks.entries()) {
            const chunk = Cell.fromKey(chunkKey);

            for (const item of items) {

                if (item.entityType === this.entityTypes.get('powerSwitch')) {
                    const ceilingLights = [];

                    const radius = 3;
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const nearbyChunk = new Cell(chunk.x + dx, chunk.y + dy);
                            const chunkData = this.getChunk(nearbyChunk.x, nearbyChunk.y);
                            for (const item of chunkData) {
                                if (item.entityType === this.entityTypes.get('ceilingLight')) {
                                    ceilingLights.push(item);
                                    break;
                                }
                            }
                        }
                    }

                    item.ceilingLights = ceilingLights;
                }

                if (item.entityType === this.entityTypes.get('ceilingLight')) {
                    const powerSwitches = [];

                    const radius = 3;
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const nearbyChunk = new Cell(chunk.x + dx, chunk.y + dy);
                            const chunkData = this.getChunk(nearbyChunk.x, nearbyChunk.y);
                            for (const item of chunkData) {
                                if (item.entityType === this.entityTypes.get('powerSwitch')) {
                                    powerSwitches.push(item);
                                    break;
                                }
                            }
                        }
                    }

                    item.powerSwitches = powerSwitches;
                }
            }
        }
    }

    findEntityFromWorld(type, x, z) {
        const chunk = this.worldToChunk(x, z);
        const chunkData = this.getChunk(chunk.x, chunk.y);
        console.log(type, x, z);
        console.log(chunkData);
        for (const item of chunkData) {
            if (item.entityType === this.entityTypes.get(type)) {
                const dx = Math.abs(item.x - x);
                const dz = Math.abs(item.z - z);
                if (dx < 0.01 && dz < 0.01) return item;
            }
        }
        return null;
    }

    findEntityFromGrid(type, x, y) {
        const chunk = this.gridToChunk(x, y);
        const chunkData = this.getChunk(chunk.x, chunk.y);

        for (const item of chunkData) {
            if (item.entityType === this.entityTypes.get(type)) {
                const dx = Math.abs(item.cell.x - x);
                const dz = Math.abs(item.cell.y - y);
                if (dx < 0.01 && dz < 0.01) return item;
            }
        }
        return null;
    }

    printGrid() {
        let output = '';
        for (let y = 0; y < this.config.mapSize; y++) {
            for (let x = 0; x < this.config.mapSize; x++) {
                const entity = this.getEntity(x, y);
                if (entity !== null) output += entity.type.toString()[0];
                else output += (this.getCell(x, y) ? '█' : ' ');
            }
            output += '\n';
        }
        console.log(output);
    }

    update(delta) {
        const playerPosition = player.object.position;
        this.loadChunksAround(playerPosition.x, playerPosition.z);
    }
}

export default Maze;