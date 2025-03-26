import * as THREE from 'three';

class ProcGen {

    // perlin noise.

    /*
    initialise class
        dungeon parameters (width, height, roomSize, numRoom)
    
    */

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

    /*
    placeRooms()
        for each room
            generate random size & position within constraints
            check for overlap
            if overlap, retry placement
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