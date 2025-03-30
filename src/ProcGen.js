//import * as THREE from 'three';

class ProcGen {

    // perlin noise.
    //https://vazgriz.com/119/procedurally-generated-dungeons/

    constructor (width, height, minRoomSize, maxRoomSize, numRoom) {
        this.height = height;
        this.width = width;
        this.minRoomSize = minRoomSize;
        this.maxRoomSize = maxRoomSize;
        this.numRoom = numRoom;
        this.mapArray = [];
        this.grid = [];
    }

   initialiseGrid() {
        this.mapArray = [];
        this.grid = Array.from({ length: this.width }, () => Array(this.height).fill(false));
   }

   generateRandomRoom() {
        const width = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;
        const height = Math.floor(Math.random() * (this.maxRoomSize - this.minRoomSize + 1)) + this.minRoomSize;
        const x = Math.floor(Math.random() * (this.width - width));
        const y = Math.floor(Math.random() * (this.height - height));
        return { width, height, x, y };
   }
        
    checkOverlap(room) {
        for (let i = room.x; i < room.x + room.width; i++) {
            for (let j = room.y; j < room.y + room.height; j++) {
                if (this.grid [i][j]) {
                    return true;
                }
            }
        }
        return false;
    }
    
    markOccupied(room) {
        for (let i = room.x; i < room.x + room.width; i++) {
            for (let j = room.y; j < room.y + room.height; j++) {
                this.grid[i][j] = true;
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

    /*
    generateCorridor()
        for each room (except last)
            choose another room as target
            create corridor (choose type, straight or L-shaped or winding etc)
            update grid with corridor path
     */

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
        //generateCorridor()  // connect room with corridor
        //createMesh()        // convert room & corridor into 3d
        //add to scene.
        return {mapArray: this.mapArray, grid: this.grid};
    }            
}

//Test
const dungeon = new ProcGen(20, 20, 3, 6, 5);
const generatedDungeon = dungeon.generateDungeon();
console.log(generatedDungeon);