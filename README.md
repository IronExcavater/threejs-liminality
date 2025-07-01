# [Liminality](https://github.com/IronExcavater/threejs-liminality)

## About

Liminality is a **first-person psychological** horror game inspired by the Backrooms. Set in a procedurally generated,
backrooms-like maze, navigate the eerie hallways haunted by flickering lights and unsettling sounds. Restore power by
activating enough power breakers, unlocking the passageway to escape this reality. But beware—statue-like entities stalk
you silently, moving only when unseen, seeking to keep you suspended in the in-between for eternity.

## 🎮 Controls

|      Key       | Action                 |
|:--------------:|------------------------|
|    **WASD**    | Move                   |
|   **Mouse**    | Look around            |
|   **Space**    | Jump                   |
|   **Escape**   | Pause the game         |
|     **E**      | Interact with objects  |
|     **R**      | Toggle flashlight      |
| **\`** (tilda) | Open developer console |

## 🧩 Gameplay Features

- **Procedural Dungeon Generation** – A unique maze structure generated
- **Weeping Angel AI** – The perfect monster to keep you terrified
- **Environmental Events** – Improved immersion with audio, visual and lighting events 
- **Physics-based Interaction** – Responsive world using Cannon.js
- **Analog Horror Effects** – Scanline, VHS noise, chromatic aberration, vignette shaders
- **Interactive Entities** – Interact with power breakers to open the sealed exits

## 🛠️ How to Run

1. Clone the repository: `git clone https://github.com/IronExcavater/liminality.git`
2. Install dependencies (Node.js is required): `npm install`
   1. If you don't have Node.js, download it [here](https://nodejs.org/en).
   2. Verify it is downloaded with `npm -v`
3. Start the localhost web server: `npm run dev`
4. Open the url provided in terminal, e.g. `https://localhost:5173`

## 👥 Credits

Developed by Group 49:
* **Niclas Rogulski** – Player controller, entity system, Weeping Angel AI, interactivity, utilities, asset loading,
procedural generation system v2
* **Wei Sern Chong** – Procedural generation system v1, maze structure, chunking
* **Cyrus Galan** – Visual and shader effects, postprocessing pipeline

## Libraries & Resources Used

* [Threejs](https://threejs.org) — 3D WebGL rendering in JavaScript
* [Cannon-es](https://pmndrs.github.io/cannon-es/) — 3D Physics library for Three.js
* [heap-js](https://www.npmjs.com/package/heap-js) — Binary heap data structure
* [David Cahill's Backrooms Map Generator](https://github.com/davidpcahill/The-Backrooms-Map-Generator) — Inspiration for dungeon logic
* Models, sound effects and textures from [Sketchfab](https://sketchfab.com/3d-models/popular),
[Pixabay](https://pixabay.com), [TextureCan](https://www.texturecan.com), [Poly Haven](https://polyhaven.com) and other
creative-commons licensed resources