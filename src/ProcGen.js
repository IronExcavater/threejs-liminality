import * as THREE from 'three';

class ProcGen {

    // perlin noise.

    /*
    initialise class
        dungeon parameters (width, height, roomSize, numRoom)
    */

    constructor (width, height, minRoomSize, maxRoomSize, numRoom) {
        //if (ProcGenDungeon.instance) return ProcGenDungeon.instance; // Prevent new instances
        this.height = height;
        this.width = width;
        this.minRoomSize = minRoomSize;
        this.maxRoomSize = maxRoomSize;
        this.numRoom = numRoom;
        //ProcGenDungeon.instance = this; // Store as singleton // had nightmares with instances, can remove if comfortable.
    }

    /* 
    generateDungeon()
        initialiseGrid()    //make a grid
        placeRooms()        //place room randomly
        generateCorridor()  // connect room with corridor
        createMesh()        // convert room & corridor into 3d
        add to scene.
    */

    /*
    initialiseGrid()
        2d array representing the dungeon.
    */
   initialiseGrid() {
        var mapArray = [];
   }

    /*
    placeRooms()
        for each room
            generate random size & position within constraints
            check for overlap
            if overlap, retry placement
            if allow overlap, delete overlapping walls
            add room into mapArray
            mark as occupied in grid

     */

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

}