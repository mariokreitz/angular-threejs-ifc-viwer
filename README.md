# angular-threejs-ifc-viewer

A minimal Angular demo for loading and exploring IFC building models in the browser using Three.js.

Built with Angular 21+, standalone components, signals, zoneless change detection, and `web-ifc-three` for IFC parsing and rendering.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21+ (standalone, signals, zoneless) |
| 3D Rendering | Three.js + angular-three |
| IFC Loading | web-ifc / web-ifc-three |
| Styling | Tailwind CSS v4 |
| Testing | Vitest |
| Linting | ESLint + angular-eslint + Prettier |

---

## Features

- Load and display IFC files directly in the browser
- Orbit camera controls with automatic model framing
- Element selection with IFC property inspection
- Linear and area measurement tools
- Hover highlighting and selection subsets
- Keyboard shortcuts for tool switching
- Zoneless Angular with OnPush throughout

---

## Getting Started

**Prerequisites:** Node.js 20+, npm 11+

```bash
# Install dependencies (also applies patches via postinstall)
npm install

# Start the development server
npm start
```

Open `http://localhost:4200` in your browser.

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server |
| `npm run build` | Production build |
| `npm run watch` | Build in watch mode |
| `npm test` | Run unit tests with Vitest |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run format` | Format with Prettier |

---

## Project Structure

```
src/app/
├── demo/                    # Smart container — wires scene, tools, and panels
├── component/               # Presentational UI components
├── feature/
│   ├── scene-graph/         # SceneService, Three.js runtime, IFC helpers
│   └── measurement/         # Linear and area measurement services
├── models/                  # Domain types
└── pipes/                   # Shared pipes
```

IFC demo files are served from `public/assets/ifc/`.  
`web-ifc` WASM binaries are resolved from `public/assets/wasm/` via `angular.json` asset config.

---

## License

MIT
