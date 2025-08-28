/**
 * Represents the simulated robot.
 */
interface RobotAPI {
    /**
     * Sets the desired speed of the robot's wheels.
     * The values for left and right speed should be between -1 (full reverse) and 1 (full forward).
     * @param left The speed of the left wheel.
     * @param right The speed of the right wheel.
     */
    setSpeed(left: number, right: number): void;

    /**
     * Registers a callback function to be executed when the robot collides with an object.
     * The callback will be invoked each time a collision event occurs.
     * @param callback The function to execute on collision, e.g., () => { robot.setSpeed(-1, 1); }
     */
    onCollision(callback: () => void): void;
}

/**
 * The global robot instance that can be programmed.
 */
declare const robot: RobotAPI;
