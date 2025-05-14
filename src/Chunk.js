class Chunk {
    constructor(chunkx, chunkz) {
        this.chunkx = chunkx;
        this.chunkz = chunkz;
        this.visible = false;
    }


    // track player position
    static trackPlayerPosition(player) {
        return {x : player.position.x, z: player.position.z};
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
                chunk.visible = false; // Explicitly unload chunks beyond the unload distance
            }
        });
    }
}

export default Chunk;