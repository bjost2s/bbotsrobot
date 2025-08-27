import './style.css';
import { Simulation } from './Simulation';
import { Robot } from './Robot';

// Get the canvas element
const canvas = document.getElementById('simulation-canvas') as HTMLCanvasElement;
if (!canvas) {
    throw new Error('Could not find canvas element with id "simulation-canvas"');
}

// Create the simulation
const simulation = new Simulation(canvas);

// Create the robot and add it to the simulation
const robot = new Robot(simulation.scene, simulation.world);
simulation.addObject(robot);

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import robotTypeDefs from './robot.d.ts?raw';

// --- Monaco Editor Setup ---

// Required for Vite support
self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

// Add our custom robot API type definitions to the editor
monaco.languages.typescript.typescriptDefaults.addExtraLib(
    robotTypeDefs,
    'file:///robot.d.ts'
);

// Create the editor
const editorContainer = document.getElementById('editor-container')!;
const editor = monaco.editor.create(editorContainer, {
    value: `// Type 'robot.' to see autocompletion
// then click "Run"

let i = 0;
setInterval(() => {
    i += 0.05;
    const left = Math.sin(i);
    const right = Math.cos(i);
    robot.setSpeed(left, right);
}, 50);
`,
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
});

// --- Connect Editor to Simulation ---
const runButton = document.getElementById('run-button')!;
let userCodeInterval: number | undefined;

runButton.addEventListener('click', async () => {
    // Clear any previously running user code
    if (userCodeInterval) {
        clearInterval(userCodeInterval);
    }
    // Reset robot speed
    robot.setSpeed(0, 0);

    const model = editor.getModel();
    if (!model) return;

    const worker = await monaco.languages.typescript.getTypeScriptWorker();
    const proxy = await worker(model.uri);
    const output = await proxy.getEmitOutput(model.uri.toString());

    if (output.outputFiles.length > 0) {
        const jsCode = output.outputFiles[0].text;
        // Execute the user's code.
        // We pass our robot instance to the function's scope.
        // We also redefine setInterval to store the interval ID so we can clear it later.
        try {
            const userFunction = new Function('robot', 'setInterval', jsCode);
            userFunction(robot, (fn: TimerHandler, t: number) => {
                userCodeInterval = setInterval(fn, t);
                return userCodeInterval;
            });
        } catch (e) {
            console.error("Error executing user code:", e);
            alert("An error occurred in your code. Check the console for details.");
        }
    }
});
