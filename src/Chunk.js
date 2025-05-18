class Chunk {
    constructor(chunkx, chunkz) {
        this.chunkx = chunkx;
        this.chunkz = chunkz;
        this.visible = false;
    }

    // render chunk
    render(scene, cellSize) {
        const geometry = new THREE.BoxGeometry(cellSize, 1, cellSize);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(this.chunkx + cellSize / 2, 0, this.chunkz + cellSize / 2);
        scene.add(mesh);
    }

    // track player position
    static trackPlayerPosition(player) {
        return {x : player.body.position.x,
               z: player.body.position.z}; // update, found body.position in player.js. UNTESTED.
    }

    // chuck world into grid
    static createChunks(worldWidth, worldDepth, chunkSize) {
        const chunks = [];
        for (let x = 0; x < worldWidth; x += chunkSize) {
            for (let z = 0; z < worldDepth; z += chunkSize) {
                chunks.push(new Chunk(x, z));
            }
        }
        return chunks;
    }

    // hide all initial chunks
    static hideChunks(chunks) {
        chunks.forEach(chunk => {
            chunk.visible = false;
        });
    }

    // dynamically load chunks on player position
    static loadChunksAroundPlayer(chunks, player, chunkSize, viewDistance) {
        const playerPos = Chunk.trackPlayerPosition(player);

        chunks.forEach(chunk => {            
            const distanceX = Math.abs(chunk.chunkx - playerPos.x);
            const distanceZ = Math.abs(chunk.chunkz - playerPos.z);
            if (distanceX <= viewDistance * chunkSize && distanceZ <= viewDistance * chunkSize) {
                chunk.visible = true;
            } else {
                chunk.visible = false;
            }
        });        
    }

    // may be redundant as loadChunksAroundPlayer handles both loading and unloading.
    static unloadDistantChunks(chunks, player, chunkSize, unloadDistance) {
        const playerPos = Chunk.trackPlayerPosition(player);

        chunks.forEach(chunk => {
            const distanceX = Math.abs(chunk.chunkx - playerPos.x);
            const distanceZ = Math.abs(chunk.chunkz - playerPos.z);
            if (distanceX > unloadDistance * chunkSize || distanceZ > unloadDistance * chunkSize) {
                chunk.visible = false;
            }
        });
    }
}

export default Chunk;