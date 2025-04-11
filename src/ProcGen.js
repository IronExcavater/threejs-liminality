//import * as THREE from 'three';

class ProcGen {

    /*  perlin noise.
        https://vazgriz.com/119/procedurally-generated-dungeons/
        In the grid: 0 for empty space; 1 for rooms; 2 for corridors

        https://thingonitsown.blogspot.com/2018/11/dungeon-generator.html
    */

    constructor (width, length, minRoomSize, maxRoomSize, numRoom) {
        this.length = length;
        this.width = width;
        this.minRoomSize = minRoomSize;
        this.maxRoomSize = maxRoomSize;
        this.numRoom = numRoom;
        this.mapArray = [];
        this.grid = [];
    }

   initialiseGrid() {
        this.mapArray = [];
        this.grid = Array.from({ length: this.width }, () => Array(this.length).fill(0)); // 0 to visualise the grid
   }

   generateRandomRoom() {
        const width = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;
        const length = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;
        const x = Math.floor(Math.random() * (this.width - width));
        const y = Math.floor(Math.random() * (this.length - length));
        return { width, length, x, y };
        // add a door
        // make rooms not just a square, but add corners, random walls inside etc.
   }
        
    checkOverlap(room) {
        for (let i = room.x; i < room.x + room.width; i++) {
            for (let j = room.y; j < room.y + room.length; j++) {
                if (this.grid [i][j]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    markOccupied(room) {
        for (let i = room.x; i < room.x + room.width; i++) {
            for (let j = room.y; j < room.y + room.length; j++) {
                this.grid[i][j] = 1; // mark as a room
            }
        }
    }

    placeRooms() {
        for (let i = 0; i < this.numRoom; i++) {
            let room;
            do {
                room = this.generateRandomRoom();
            } while (this.checkOverlap(room));
            // maybe allow overlap later?
            this.mapArray.push(room);
            this.markOccupied(room);
        }        
    }
    
    generateCorridor() {
        // make multiple corridors
        const connectedRooms = [this.mapArray[0]]; // Start with the first room
        const unconnectedRooms = this.mapArray.slice(1); // Remaining rooms
    
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
                const index = unconnectedRooms.indexOf(closestPair.to);
                if (index !== -1) unconnectedRooms.splice(index, 1);
            } else {
                break; // fallback just in case
            }
        }
    }
    

    findNearestRoom(currentRoom) { // Manhattan Algorithm
        let nearestRoom = null;
        let minDistance = Infinity;

        for (const room of this.mapArray) {
            if (room === currentRoom) continue;

            let distance = Math.abs(currentRoom.x - room.x) + Math.abs(currentRoom.y - room.y);

            if (distance < minDistance) {
                minDistance = distance;
                nearestRoom = room;
            }
        }
        return nearestRoom;
    }

    createCorridor(roomA, roomB) {
        let x1 = roomA.x + Math.floor(roomA.width / 2);
        let y1 = roomA.y + Math.floor(roomA.length / 2);

        let x2 = roomB.x + Math.floor(roomB.width / 2);
        let y2 = roomB.y + Math.floor(roomB.length / 2);

        if (Math.random() < 0.5) { // randomly decide to draw the corridors horizontal or vertical first.
            this.drawHorizontalCorridor(x1, x2, y1); // draw horizontal corridor first, then vertical.
            this.drawVerticalCorridor(y1, y2, x2);
        } else {
            this.drawVerticalCorridor(y1, y2, x1); // opposite above.
            this.drawHorizontalCorridor(x1, x2, y2);
        }
    }

    drawHorizontalCorridor(x1, x2, y) {
        for (let x = Math.min(x1, x2); x <= Math.max (x1, x2); x++) {
            if (this.grid[x][y] === 0) this.grid[x][y] = 2;
        }
    }


    drawVerticalCorridor(y1, y2, x) {
        for (let y = Math.min(y1, y2); x <= Math.max (y1, y2); x++) {
            if (this.grid[x][y] === 0) this.grid[x][y] = 2;
        }
    }

    /*
    createMesh()
        for each room & corridor
            create three.js BoxGeometry / PlaneGeometry
            apply material & texture
            merge geometries for optimisation
            create mesh & add to scene.
            
     */

    generateDungeon() {
        this.initialiseGrid();    //make a grid
        this.placeRooms();
        this.generateCorridor();  // connect room with corridor
        //createMesh()        // convert room & corridor into 3d
        //add to scene.
        return {mapArray: this.mapArray, grid: this.grid};
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

//Test
const dungeon = new ProcGen(20, 20, 3, 6, 7);
dungeon.generateDungeon();
dungeon.printGrid();