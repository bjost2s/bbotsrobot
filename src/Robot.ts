import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Robot {
    public visual: THREE.Group;
    public body: CANNON.Body;

    private scene: THREE.Scene;
    private world: CANNON.World;
    private leftSpeed = 0;
    private rightSpeed = 0;

    constructor(scene: THREE.Scene, world: CANNON.World) {
        this.scene = scene;
        this.world = world;

        this.visual = new THREE.Group();
        this.visual.position.y = 1;
        this.scene.add(this.visual);

        // --- Visual Representation (Corrected 2-Wheel Version) ---
        const chassisMat = new THREE.MeshStandardMaterial({ color: 0xdd0000 });
        const chassisGeo = new THREE.BoxGeometry(0.8, 0.4, 1.0); // Made it slightly shorter
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        this.visual.add(chassis);

        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 18);
        const wheelQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);

        // Left Wheel
        const leftWheel = new THREE.Mesh(wheelGeo, wheelMat);
        leftWheel.quaternion.copy(wheelQuaternion);
        leftWheel.position.set(-0.5, 0, 0); // Positioned on the side
        this.visual.add(leftWheel);

        // Right Wheel
        const rightWheel = new THREE.Mesh(wheelGeo, wheelMat);
        rightWheel.quaternion.copy(wheelQuaternion);
        rightWheel.position.set(0.5, 0, 0); // Positioned on the side
        this.visual.add(rightWheel);

        // Axle
        const axleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
        const axleQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        const axle = new THREE.Mesh(axleGeo, axleMat);
        axle.quaternion.copy(axleQuaternion);
        axle.position.set(0, 0, 0); // Centered
        this.visual.add(axle);

        // Caster Wheel (for visual realism)
        const casterMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const casterGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const caster = new THREE.Mesh(casterGeo, casterMat);
        caster.position.set(0, -0.15, -0.4); // At the back and slightly down
        this.visual.add(caster);


        // --- Physical Representation --- (remains unchanged)
        const robotShape = new CANNON.Box(new CANNON.Vec3(0.4, 0.2, 0.5));
        this.body = new CANNON.Body({
            mass: 10,
            position: new CANNON.Vec3(0, 1, 0),
            shape: robotShape,
            angularDamping: 0.9,
            linearDamping: 0.5,
        });
        this.world.addBody(this.body);

        this.world.addEventListener('preStep', this.applyForces.bind(this));
    }

    public setSpeed(left: number, right: number): void {
        this.leftSpeed = Math.max(-1, Math.min(1, left));
        this.rightSpeed = Math.max(-1, Math.min(1, right));
    }

    private applyForces(): void {
        const maxForce = 20;
        const wheelDist = 0.4; // This matches the physics box size, not visual wheel position

        const leftForceMagnitude = this.leftSpeed * maxForce;
        const rightForceMagnitude = this.rightSpeed * maxForce;

        const forceVec = new CANNON.Vec3(0, 0, 1);

        this.body.applyLocalForce(forceVec.scale(leftForceMagnitude), new CANNON.Vec3(-wheelDist, 0, 0));
        this.body.applyLocalForce(forceVec.scale(rightForceMagnitude), new CANNON.Vec3(wheelDist, 0, 0));
    }

    public update(): void {
        this.visual.position.copy(this.body.position as any);
        this.visual.quaternion.copy(this.body.quaternion as any);
    }
}
