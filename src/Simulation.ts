import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Simulation {
    public scene: THREE.Scene;
    public world: CANNON.World;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;

    constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene();
        this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
        this.clock = new THREE.Clock();

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas });
        const simContainer = document.getElementById('simulation-container')!;
        this.renderer.setSize(simContainer.clientWidth, simContainer.clientHeight);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, simContainer.clientWidth / simContainer.clientHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Ground
        this.createGround();

        // Obstacle
        this.createObstacle(new THREE.Vector3(0, 0.5, -5));

        // Handle window resizing
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start animation loop
        this.animate();
    }

    private createGround() {
        // Visual
        const groundGeo = new THREE.PlaneGeometry(30, 30);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.DoubleSide });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.rotation.x = -Math.PI / 2;
        this.scene.add(groundMesh);

        // Physical
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
    }

    private onWindowResize() {
        const simContainer = document.getElementById('simulation-container')!;
        this.camera.aspect = simContainer.clientWidth / simContainer.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(simContainer.clientWidth, simContainer.clientHeight);
    }

    private updatableObjects: { update: () => void }[] = [];

    public addObject(obj: { update: () => void }) {
        this.updatableObjects.push(obj);
    }

    private createObstacle(position: THREE.Vector3) {
        const size = 1.5;
        // Visual
        const obstacleGeo = new THREE.BoxGeometry(size, size, size);
        const obstacleMat = new THREE.MeshStandardMaterial({ color: 0x00aaff });
        const obstacleMesh = new THREE.Mesh(obstacleGeo, obstacleMat);
        obstacleMesh.position.copy(position);
        this.scene.add(obstacleMesh);

        // Physical
        const obstacleShape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
        const obstacleBody = new CANNON.Body({
            mass: 0, // Static body
            shape: obstacleShape,
            position: position as any,
        });
        this.world.addBody(obstacleBody);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta();
        this.world.step(1 / 60, deltaTime, 3);

        // Update all registered (dynamic) objects
        for (const obj of this.updatableObjects) {
            obj.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}
