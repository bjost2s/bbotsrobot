import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Robot {
    public mesh: THREE.Mesh;
    public body: CANNON.Body;

    private scene: THREE.Scene;
    private world: CANNON.World;
    private leftSpeed = 0;
    private rightSpeed = 0;

    constructor(scene: THREE.Scene, world: CANNON.World) {
        this.scene = scene;
        this.world = world;

        // Visual representation
        const robotGeo = new THREE.BoxGeometry(0.8, 0.4, 1.2); // width, height, length
        const robotMat = new THREE.MeshStandardMaterial({ color: 0xdd0000 });
        this.mesh = new THREE.Mesh(robotGeo, robotMat);
        this.mesh.position.y = 1;
        this.scene.add(this.mesh);

        // Physical representation
        const robotShape = new CANNON.Box(new CANNON.Vec3(0.4, 0.2, 0.6));
        this.body = new CANNON.Body({
            mass: 10, // kg
            position: new CANNON.Vec3(0, 1, 0),
            shape: robotShape,
            angularDamping: 0.9, // High damping to prevent spinning out
            linearDamping: 0.5,
        });
        this.world.addBody(this.body);

        // Apply forces before each physics step
        this.world.addEventListener('preStep', this.applyForces.bind(this));
    }

    /**
     * Sets the desired speed of the robot's wheels. The values are clamped between -1 and 1.
     * @param left - Speed of the left wheel.
     * @param right - Speed of the right wheel.
     */
    public setSpeed(left: number, right: number): void {
        this.leftSpeed = Math.max(-1, Math.min(1, left));
        this.rightSpeed = Math.max(-1, Math.min(1, right));
    }

    /**
     * This method is called by the physics engine before each step.
     * It applies forces to the wheels to simulate differential drive.
     */
    private applyForces(): void {
        const maxForce = 20; // Maximum force in Newtons
        const wheelDist = 0.4; // Distance from center to wheel on x-axis

        const leftForceMagnitude = this.leftSpeed * maxForce;
        const rightForceMagnitude = this.rightSpeed * maxForce;

        // Force vector is along the robot's local z-axis (forward)
        const forceVec = new CANNON.Vec3(0, 0, 1);

        // Apply force at the wheel positions. The positions are relative to the body's center.
        this.body.applyLocalForce(forceVec.scale(leftForceMagnitude), new CANNON.Vec3(-wheelDist, 0, 0));
        this.body.applyLocalForce(forceVec.scale(rightForceMagnitude), new CANNON.Vec3(wheelDist, 0, 0));
    }

    /**
     * Updates the robot's visual mesh to match its physics body's position and rotation.
     * This is called from the main simulation loop.
     */
    public update(): void {
        this.mesh.position.copy(this.body.position as any);
        this.mesh.quaternion.copy(this.body.quaternion as any);
    }
}
