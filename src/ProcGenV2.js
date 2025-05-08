import * as THREE from 'three';

export class ProcGenV2 {
    constructor({
        scene,
        screenWidth = 1920,
        screenHeight = 1080,
        cellSize = 8,
        mazeFillPercentage = 0.8,
        numMazes = 1000,
        stopCollisionProbability = 0.5,
        numRooms = 2,
        roomWidthRange = [1, 32],
        roomHeightRange = [1, 32],
        numPillarRooms = 1,
        pillarRoomWidthRange = [1, 32],
        pillarRoomHeightRange = [1, 32],
        pillarSpacingRange = [2, 6],
        numCustomRooms = 1,
        minNumSides = 2,
        maxNumSides = 8,
        minCustomRoomRadius = 1,
        maxCustomRoomRadius = 16,
    } = {}) {
        this.scene = scene;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.cellSize = cellSize;
        this.mazeFillPercentage = mazeFillPercentage;
        this.numMazes = numMazes;
        this.stopCollisionProbability = stopCollisionProbability;
        this.numRooms = numRooms;
        this.roomWidthRange = roomWidthRange;
        this.roomHeightRange = roomHeightRange;
        this.numPillarRooms = numPillarRooms;
        this.pillarRoomWidthRange = pillarRoomWidthRange;
        this.pillarRoomHeightRange = pillarRoomHeightRange;
        this.pillarSpacingRange = pillarSpacingRange;
        this.numCustomRooms = numCustomRooms;
        this.minNumSides = minNumSides;
        this.maxNumSides = maxNumSides;
        this.minCustomRoomRadius = minCustomRoomRadius;
        this.maxCustomRoomRadius = maxCustomRoomRadius;

        this.numCols = Math.floor(screenWidth / cellSize);
        this.numRows = Math.floor(screenHeight / cellSize);
        this.maze = [];
        this.meshes = [];

        this.generateAll();
    }

    clear() {
        this.meshes.forEach(mesh => this.scene.remove(mesh));
        this.meshes = [];
    }

    generateAll() {
        this.clear();
        this.generateMaze();
        this.generateRooms();
        this.generatePillarRooms();
        this.generateCustomRooms();
        this.renderMaze();
    }

    generateMaze() {
        this.maze = Array.from({ length: this.numRows }, (_, y) =>
            Array.from({ length: this.numCols }, (_, x) => ({
                x,
                y,
                visited: false,
            }))
        );

        const visitedCells = new Set();
        for (let i = 0; i < this.numMazes; i++) {
            let x = Math.floor(Math.random() * this.numCols);
            let y = Math.floor(Math.random() * this.numRows);
            const key = `${x},${y}`;
            visitedCells.add(key);
            let frontier = [{ x, y }];

            while (
                visitedCells.size / (this.numCols * this.numRows) <
                this.mazeFillPercentage
            ) {
                if (frontier.length === 0) break;

                const randIndex = Math.floor(Math.random() * frontier.length);
                const { x, y } = frontier[randIndex];
                frontier.splice(randIndex, 1);

                this.maze[y][x].visited = true;
                visitedCells.add(`${x},${y}`);

                const neighbors = [];
                if (x > 1 && !visitedCells.has(`${x - 2},${y}`)) neighbors.push({ x: x - 2, y });
                if (x < this.numCols - 2 && !visitedCells.has(`${x + 2},${y}`)) neighbors.push({ x: x + 2, y });
                if (y > 1 && !visitedCells.has(`${x},${y - 2}`)) neighbors.push({ x, y: y - 2 });
                if (y < this.numRows - 2 && !visitedCells.has(`${x},${y + 2}`)) neighbors.push({ x, y: y + 2 });

                if (neighbors.length > 0) {
                    const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
                    const nx = nextCell.x;
                    const ny = nextCell.y;

                    const mx = Math.floor((x + nx) / 2);
                    const my = Math.floor((y + ny) / 2);

                    if (
                        Math.random() > this.stopCollisionProbability ||
                        !this.maze[my][mx].visited
                    ) {
                        frontier.push({ x: nx, y: ny });
                        this.maze[my][mx].visited = true;
                        visitedCells.add(`${nx},${ny}`);
                        visitedCells.add(`${mx},${my}`);
                    }
                }
            }
        }
    }

    generateRooms() {
        for (let i = 0; i < this.numRooms; i++) {
            const roomWidth = this.randInt(...this.roomWidthRange);
            const roomHeight = this.randInt(...this.roomHeightRange);
            const x = this.randInt(0, this.numCols - roomWidth);
            const y = this.randInt(0, this.numRows - roomHeight);

            for (let row = y; row < y + roomHeight; row++) {
                for (let col = x; col < x + roomWidth; col++) {
                    this.maze[row][col].visited = true;
                }
            }
        }
    }

    generatePillarRooms() {
        for (let i = 0; i < this.numPillarRooms; i++) {
            const roomWidth = this.randInt(...this.pillarRoomWidthRange);
            const roomHeight = this.randInt(...this.pillarRoomHeightRange);
            const x = this.randInt(0, this.numCols - roomWidth);
            const y = this.randInt(0, this.numRows - roomHeight);

            for (let row = y; row < y + roomHeight; row++) {
                for (let col = x; col < x + roomWidth; col++) {
                    this.maze[row][col].visited = true;
                }
            }

            const pillarSpacing = this.randInt(...this.pillarSpacingRange);
            for (let row = y; row < y + roomHeight; row += pillarSpacing) {
                for (let col = x; col < x + roomWidth; col += pillarSpacing) {
                    this.maze[row][col].visited = false;
                }
            }
        }
    }

    generateCustomRooms() {
        for (let i = 0; i < this.numCustomRooms; i++) {
            const numSides = this.randInt(this.minNumSides, this.maxNumSides);
            const radius = this.randInt(this.minCustomRoomRadius, this.maxCustomRoomRadius);
            const cx = this.randInt(radius * 2, this.numCols - radius * 2);
            const cy = this.randInt(radius * 2, this.numRows - radius * 2);

            const vertices = [];
            const angleStep = (Math.PI * 2) / numSides;
            for (let j = 0; j < numSides; j++) {
                const angle = j * angleStep;
                const vx = Math.floor(cx + radius * Math.cos(angle));
                const vy = Math.floor(cy + radius * Math.sin(angle));
                vertices.push({ x: vx, y: vy });
            }

            for (let row = cy - radius; row < cy + radius; row++) {
                for (let col = cx - radius; col < cx + radius; col++) {
                    if (this.isInsidePolygon(col, row, vertices)) {
                        this.maze[row][col].visited = true;
                    }
                }
            }
        }
    }

    renderMaze() {
        const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        for (let row of this.maze) {
            for (let cell of row) {
                const geometry = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
                const material = cell.visited ? whiteMat : blackMat;
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    cell.x * this.cellSize - this.screenWidth / 2 + this.cellSize / 2,
                    cell.y * this.cellSize - this.screenHeight / 2 + this.cellSize / 2,
                    0
                );
                this.scene.add(mesh);
                this.meshes.push(mesh);
            }
        }
    }

    isInsidePolygon(x, y, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            const intersect =
                yi > y !== yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
