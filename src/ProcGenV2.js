// import * as THREE from 'three';

class ProcGenV2 {

    constructor(width, length, minRoomSize, maxRoomSize, numRooms) {
        this.width = width;
        this.length = length;
        this.minRoomSize = minRoomSize;
        this.maxRoomSize = maxRoomSize;
        this.numRooms = numRooms;
        this.mapArray = [];
        this.grid = [];
    }

    initialiseGrid() {
        this.mapArray = [];
        this.grid = Array.from({ length: this.width }, () => Array(this.length).fill(0));
    }

    generateRandomRoom() {
        const width = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;
        const length = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;
        const x = Math.floor(Math.random() * (this.width - width));
        const y = Math.floor(Math.random() * (this.length - length));
        return { width, length, x, y };
    }

    checkOverlap(room) {
        for (let i = room.x; i < room.x + room.width; i++) {
            for (let j = room.y; j < room.y + room.length; j++) {
                if (this.grid[i][j]) {
                    return true;
                }
            }
        }
        return false;
    }

    markOccupied(room) {
        for (let i = room.x; i < room.x + room.width; i++) {
            for (let j = room.y; j < room.y + room.length; j++) {
                this.grid[i][j] = 1;
            }
        }
    }

    placeRooms() {
        for (let i = 0; i < this.numRooms; i++) {
            let room;
            let attempts = 0;
            do {
                room = this.generateRandomRoom();
                attempts++;
                if (attempts > 100) break; // avoid infinite loop
            } while (this.checkOverlap(room));
            this.mapArray.push(room);
            this.markOccupied(room);
        }
    }

    createCorridor(roomA, roomB) {
        let x1 = roomA.x + Math.floor(roomA.width / 2);
        let y1 = roomA.y + Math.floor(roomA.length / 2);
        let x2 = roomB.x + Math.floor(roomB.width / 2);
        let y2 = roomB.y + Math.floor(roomB.length / 2);

        if (Math.random() < 0.5) {
            this.drawHorizontalCorridor(x1, x2, y1);
            this.drawVerticalCorridor(y1, y2, x2);
        } else {
            this.drawVerticalCorridor(y1, y2, x1);
            this.drawHorizontalCorridor(x1, x2, y2);
        }
    }

    drawHorizontalCorridor(x1, x2, y) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (this.grid[x][y] === 0) this.grid[x][y] = 2;
        }
    }

    drawVerticalCorridor(y1, y2, x) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (this.grid[x][y] === 0) this.grid[x][y] = 2;
        }
    }

    generateCorridors() {
        const connectedRooms = [this.mapArray[0]];
        const unconnectedRooms = this.mapArray.slice(1);

        while (unconnectedRooms.length > 0) {
            let closestPair = null;
            let shortestDistance = Infinity;

            for (const connected of connectedRooms) {
                for (const unconnected of unconnectedRooms) {
                    const distance = Math.abs(connected.x - unconnected.x) + Math.abs(connected.y - unconnected.y);
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        closestPair = { from: connected, to: unconnected };
                    }
                }
            }

            if (closestPair) {
                this.createCorridor(closestPair.from, closestPair.to);
                connectedRooms.push(closestPair.to);
                unconnectedRooms.splice(unconnectedRooms.indexOf(closestPair.to), 1);
            } else {
                break;
            }
        }
    }

    generateDungeon() {
        this.initialiseGrid();
        this.placeRooms();
        this.generateCorridors();
        return { mapArray: this.mapArray, grid: this.grid };
    }

    createMesh() {
        const group = new THREE.Group();
        const roomMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const corridorMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.length; y++) {
                let value = this.grid[x][y];
                if (value === 0) continue;

                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = value === 1 ? roomMaterial : corridorMaterial;
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(x, 0, y);
                group.add(mesh);
            }
        }

        return group;
    }

    printGrid() {
        let output = "";
        for (let y = 0; y < this.length; y++) {
            for (let x = 0; x < this.width; x++) {
                output += this.grid[x][y];
            }
            output += "\n";
        }
        console.log(output);
    }
}

export default ProcGenV2;
