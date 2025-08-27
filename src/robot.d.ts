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
}

/**
 * The global robot instance that can be programmed.
 */
declare const robot: RobotAPI;
