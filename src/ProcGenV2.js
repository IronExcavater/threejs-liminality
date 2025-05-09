import * as THREE from 'three';
import {scene} from "./app.js";
import {BoxObject, PlaneObject} from "./GameObject.js";
import {getMaterial} from "./resources.js";

export class ProcGenV2 {
    constructor(config = {}) {
        // Default configuration
        this.config = {
            // World dimensions
            worldWidth: 100,
            worldHeight: 100,
            cellSize: 1,
            
            // Maze generation
            mazeFillPercentage: 0.8,
            numMazes: 1000,
            stopCollisionProbability: 0.5,
            
            // Rooms
            numRooms: 2,
            roomWidthRange: [1, 32],
            roomHeightRange: [1, 32],
            
            // Pillar rooms
            numPillarRooms: 1,
            pillarRoomWidthRange: [1, 32],
            pillarRoomHeightRange: [1, 32],
            pillarSpacingRange: [2, 6],
            
            // Custom rooms
            numCustomRooms: 1,
            minNumSides: 3,
            maxNumSides: 8,
            minCustomRoomRadius: 1,
            maxCustomRoomRadius: 16,
            
            // 3D settings
            wallHeight: 2,
            floorColor: 0xaaaaaa,
            wallColor: 0xdddddd,
            ceilingColor: 0x888888,
            ambientLightColor: 0x404040,
            directionalLightColor: 0xffffff,
            directionalLightIntensity: 4
        };

        // Merge custom config with defaults
        Object.assign(this.config, config);

        // Calculate derived values
        this.numCols = Math.floor(this.config.worldWidth / this.config.cellSize);
        this.numRows = Math.floor(this.config.worldHeight / this.config.cellSize);

        // Initialize maze data
        this.maze = null;
        
        // Initialize Three.js objects
        this.floor = null;
        this.ceiling = null;
        this.wallGroup = null;
        this.pillarGroup = null;
        
        // Create materials
        this.floorMaterial = new THREE.MeshStandardMaterial({ color: this.config.floorColor });
        this.wallMaterial = new THREE.MeshStandardMaterial({ color: this.config.wallColor });
        this.ceilingMaterial = new THREE.MeshStandardMaterial({ color: this.config.ceilingColor });
        this.pillarMaterial = new THREE.MeshStandardMaterial({ color: 0xbbbbbb });
        
        // Generate initial world
        this.generateWorld();
    }

    generateMaze() {
        // Initialize maze (false = empty space, true = wall)
        this.maze = Array(this.numRows).fill().map(() => Array(this.numCols).fill(false));
        
        // Generate multiple maze layers
        for (let i = 0; i < this.config.numMazes; i++) {
            let visited = new Set();
            let x = Math.floor(Math.random() * this.numCols);
            let y = Math.floor(Math.random() * this.numRows);
            visited.add(`${x},${y}`);
            let frontier = [[x, y]];
            
            while (visited.size / (this.numCols * this.numRows) < this.config.mazeFillPercentage) {
                if (frontier.length === 0) break;
                
                let idx = Math.floor(Math.random() * frontier.length);
                [x, y] = frontier[idx];
                frontier.splice(idx, 1);
                
                this.maze[y][x] = true;
                
                // Get neighbors
                let neighbors = [];
                if (x > 1 && !visited.has(`${x-2},${y}`)) neighbors.push([x-2, y]);
                if (x < this.numCols-2 && !visited.has(`${x+2},${y}`)) neighbors.push([x+2, y]);
                if (y > 1 && !visited.has(`${x},${y-2}`)) neighbors.push([x, y-2]);
                if (y < this.numRows-2 && !visited.has(`${x},${y+2}`)) neighbors.push([x, y+2]);
                
                if (neighbors.length > 0) {
                    let [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
                    frontier.push([nx, ny]);
                    visited.add(`${nx},${ny}`);
                    
                    // Carve path between cells
                    if (Math.random() > this.config.stopCollisionProbability || 
                        !this.maze[Math.floor((y+ny)/2)][Math.floor((x+nx)/2)]) {
                        this.maze[Math.floor((y+ny)/2)][Math.floor((x+nx)/2)] = true;
                    }
                }
            }
        }
    }

    printGrid() {
        let output = "";
        console.log(this.maze)
        for (let y = 0; y < this.numRows; y++) {
            for (let x = 0; x < this.numCols; x++) {
                output += this.maze[y][x] ? "█" : "░";
            }
            output += "\n";
        }
        console.log(output);
    }

    generateRooms() {
        for (let i = 0; i < this.config.numRooms; i++) {
            let roomWidth = Math.floor(Math.random() * 
                (this.config.roomWidthRange[1] - this.config.roomWidthRange[0] + 1)) + this.config.roomWidthRange[0];
            let roomHeight = Math.floor(Math.random() * 
                (this.config.roomHeightRange[1] - this.config.roomHeightRange[0] + 1)) + this.config.roomHeightRange[0];
            let x = Math.floor(Math.random() * (this.numCols - roomWidth));
            let y = Math.floor(Math.random() * (this.numRows - roomHeight));
            
            for (let row = y; row < y + roomHeight; row++) {
                for (let col = x; col < x + roomWidth; col++) {
                    this.maze[row][col] = true; // double check this
                }
            }
        }
    }

    generatePillarRooms() {
        for (let i = 0; i < this.config.numPillarRooms; i++) {
            let roomWidth = Math.floor(Math.random() * 
                (this.config.pillarRoomWidthRange[1] - this.config.pillarRoomWidthRange[0] + 1)) + this.config.pillarRoomWidthRange[0];
            let roomHeight = Math.floor(Math.random() * 
                (this.config.pillarRoomHeightRange[1] - this.config.pillarRoomHeightRange[0] + 1)) + this.config.pillarRoomHeightRange[0];
            let x = Math.floor(Math.random() * (this.numCols - roomWidth));
            let y = Math.floor(Math.random() * (this.numRows - roomHeight));
            
            // Create room floor
            for (let row = y; row < y + roomHeight; row++) {
                for (let col = x; col < x + roomWidth; col++) {
                    this.maze[row][col] = true;
                }
            }
            
            // Add pillars
            let pillarSpacing = Math.floor(Math.random() * 
                (this.config.pillarSpacingRange[1] - this.config.pillarSpacingRange[0] + 1)) + this.config.pillarSpacingRange[0];
            for (let row = y; row < y + roomHeight; row += pillarSpacing) {
                for (let col = x; col < x + roomWidth; col += pillarSpacing) {
                    this.maze[row][col] = false; // Space for pillar
                }
            }
        }
    }

    isInsidePolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            
            const intersect = ((yi > point[1]) !== (yj > point[1]))
                && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    generateCustomRooms() {
        for (let i = 0; i < this.config.numCustomRooms; i++) {
            let numSides = Math.floor(Math.random() * 
                (this.config.maxNumSides - this.config.minNumSides + 1)) + this.config.minNumSides;
            let radius = Math.floor(Math.random() * 
                (this.config.maxCustomRoomRadius - this.config.minCustomRoomRadius + 1)) + this.config.minCustomRoomRadius;
            let centerX = Math.floor(Math.random() * (this.numCols - radius * 2)) + radius;
            let centerY = Math.floor(Math.random() * (this.numRows - radius * 2)) + radius;
            
            // Generate polygon vertices
            let polygon = [];
            for (let j = 0; j < numSides; j++) {
                let angle = (j / numSides) * Math.PI * 2;
                let x = centerX + radius * Math.cos(angle);
                let y = centerY + radius * Math.sin(angle);
                polygon.push([x, y]);
            }
            
            // Fill polygon area
            let minX = Math.max(0, centerX - radius);
            let maxX = Math.min(this.numCols - 1, centerX + radius);
            let minY = Math.max(0, centerY - radius);
            let maxY = Math.min(this.numRows - 1, centerY + radius);
            
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    if (this.isInsidePolygon([x, y], polygon)) {
                        this.maze[y][x] = true;
                    }
                }
            }
        }
    }

    createWalls() {
        this.wallGroup = new THREE.Group();
        
        for (let y = 0; y < this.numRows; y++) {
            for (let x = 0; x < this.numCols; x++) {
                if (!this.maze[y][x]) continue; // Skip empty spaces
                
                // Check if this cell should have walls
                let hasWall = false;
                
                // Check adjacent cells
                if (x === 0 || !this.maze[y][x-1]) hasWall = true; // Left
                if (x === this.numCols-1 || !this.maze[y][x+1]) hasWall = true; // Right
                if (y === 0 || !this.maze[y-1][x]) hasWall = true; // Top
                if (y === this.numRows-1 || !this.maze[y+1][x]) hasWall = true; // Bottom
                
                if (hasWall) {
                    const wall = new BoxObject({
                        size: new THREE.Vector3(this.config.cellSize,
                            this.config.wallHeight,
                            this.config.cellSize),
                        material: getMaterial('wallpaper'),
                        position: new THREE.Vector3(
                            x * this.config.cellSize - this.config.worldWidth / 2 + this.config.cellSize / 2,
                            1,
                            y * this.config.cellSize - this.config.worldHeight / 2 + this.config.cellSize / 2
                        ),
                    })
                }
            }
        }
    }

    createPillars() {
        this.pillarGroup = new THREE.Group();
        
        for (let y = 0; y < this.numRows; y++) {
            for (let x = 0; x < this.numCols; x++) {
                // Check if this is a pillar location (empty space surrounded by walls)
                if (this.maze[y][x]) continue; // Skip walls
                
                let isPillar = true;
                
                // Check adjacent cells
                if (x > 0 && !this.maze[y][x-1]) isPillar = false;
                if (x < this.numCols-1 && !this.maze[y][x+1]) isPillar = false;
                if (y > 0 && !this.maze[y-1][x]) isPillar = false;
                if (y < this.numRows-1 && !this.maze[y+1][x]) isPillar = false;
                
                if (isPillar) {
                    const pillarGeometry = new THREE.CylinderGeometry(
                        this.config.cellSize / 4,
                        this.config.cellSize / 4,
                        this.config.wallHeight,
                        8
                    );
                    const pillar = new THREE.Mesh(pillarGeometry, this.pillarMaterial);
                    
                    // Position the pillar
                    pillar.position.x = x * this.config.cellSize - this.config.worldWidth / 2 + this.config.cellSize / 2;
                    pillar.position.z = y * this.config.cellSize - this.config.worldHeight / 2 + this.config.cellSize / 2;
                    pillar.position.y = this.config.wallHeight / 2;
                    
                    this.pillarGroup.add(pillar);
                }
            }
        }
    }

    createFloorAndCeiling() {
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(this.config.worldWidth, this.config.worldHeight);
        this.floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        this.floor.rotation.x = -Math.PI / 2;

        const floor = new PlaneObject({
            material: getMaterial('carpet'),
            position: new THREE.Vector3(0, -1, 0),
            rotation: new THREE.Euler(-Math.PI/2, 0, 0),
        });

        const ceiling = new PlaneObject({
            material: getMaterial('ceiling'),
            position: new THREE.Vector3(0, 1, 0),
            rotation: new THREE.Euler(Math.PI/2, 0, 0),
        });
        
        // Create ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(this.config.worldWidth, this.config.worldHeight);
        this.ceiling = new THREE.Mesh(ceilingGeometry, this.ceilingMaterial);
        this.ceiling.rotation.x = Math.PI / 2;
        this.ceiling.position.y = this.config.wallHeight;
    }

    generateWorld() {
        // Generate maze data
        this.generateMaze();
        this.generateRooms();
        this.generatePillarRooms();
        this.generateCustomRooms();
        
        // Create 3D objects
        this.createFloorAndCeiling();
        this.createWalls();
        this.createPillars();

        this.addToScene(scene)
    }

    addToScene(scene) {
        //scene.add(this.floor);
        //scene.add(this.ceiling);
        scene.add(this.wallGroup);
        scene.add(this.pillarGroup);
    }

    regenerate() {
        this.generateWorld();
    }

    getCameraPosition() {
        return {
            x: 0,
            y: this.config.wallHeight / 2,
            z: -200
        };
    }

    getCameraLookAt() {
        return {
            x: 0,
            y: this.config.wallHeight / 2,
            z: 0
        };
    }
}