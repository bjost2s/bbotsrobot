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
    value: `// The robot will drive forward until it hits the obstacle.
// The onCollision function will then make it back up and turn.

// Set the robot to drive forward
robot.setSpeed(1, 1);

// Register a function to be called when a collision occurs
robot.onCollision(() => {
    // Back up
    robot.setSpeed(-1, -1);

    // After a short delay, turn
    setTimeout(() => {
        robot.setSpeed(-0.5, 1); // Turn left
    }, 500); // 500ms delay

    // After another delay, drive forward again
    setTimeout(() => {
        robot.setSpeed(1, 1);
    }, 1500); // 1.5s delay
});
`,
    language: 'typescript',
    theme: 'vs-dark',
    automaticLayout: true,
});

// --- Connect Editor to Simulation ---
const runButton = document.getElementById('run-button')!;
const userCodeTimers: (number | NodeJS.Timeout)[] = [];

function stopUserCode() {
    // Clear all scheduled timers from the previous run
    userCodeTimers.forEach(clearTimeout); // clearTimeout works for both setTimeout and setInterval
    userCodeTimers.length = 0; // Empty the array
    robot.reset();
}

runButton.addEventListener('click', async () => {
    stopUserCode();

    const model = editor.getModel();
    if (!model) return;

    const worker = await monaco.languages.typescript.getTypeScriptWorker();
    const proxy = await worker(model.uri);
    const output = await proxy.getEmitOutput(model.uri.toString());

    if (output.outputFiles.length > 0) {
        const jsCode = output.outputFiles[0].text;
        try {
            // Create a sandboxed function with a custom setTimeout and setInterval
            // that track the timer IDs.
            const userFunction = new Function('robot', 'setTimeout', 'setInterval', jsCode);

            const customSetTimeout = (fn: TimerHandler, t: number) => {
                const id = setTimeout(fn, t);
                userCodeTimers.push(id);
                return id;
            };

            const customSetInterval = (fn: TimerHandler, t: number) => {
                const id = setInterval(fn, t);
                userCodeTimers.push(id);
                return id;
            };

            userFunction(robot, customSetTimeout, customSetInterval);
        } catch (e) {
            console.error("Error executing user code:", e);
            alert("An error occurred in your code. Check the console for details.");
        }
    }
});
