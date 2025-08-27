import { BN } from "fuels";
export const ENTRANCE = { x: 1 << 30, y: 1 << 30 };
// TypeScript implementation of _calculate_zone from Sway
export function calculateZone(position) {
    // Define zone size (how many position units per zone)
    // Using power of 2 for efficient division
    const zoneSize = 63n;
    const halfZone = zoneSize / 2n;
    // Add half_zone to center zones around entrance position
    // This ensures entrance ± half_zone are in the same zone
    const xZone = (BigInt(position.x) + halfZone) / zoneSize;
    const yZone = (BigInt(position.y) + halfZone) / zoneSize;
    // Calculate a unique zone index using bit manipulation
    // This creates a unique number for each (x,y) zone coordinate pair
    // Using 32 bits for each coordinate (more than enough for game zones)
    // Zone index = (y_zone << 32) | x_zone
    return new BN(((yZone << 32n) | xZone).toString());
}
/**
 * Returns the current zone and 8 surrounding zones in clockwise order starting from center and then top
 * Order: center, top, top-right, right, bottom-right, bottom, bottom-left, left, top-left
 * With x axis moving from left to right and y from top to bottom
 */
export function calculateSurroundingZones(position) {
    // Define zone size (how many position units per zone)
    const zoneSize = 63n;
    const halfZone = zoneSize / 2n;
    // Calculate the zone coordinates for the current position
    const xZone = (BigInt(position.x) + halfZone) / zoneSize;
    const yZone = (BigInt(position.y) + halfZone) / zoneSize;
    // Define the offsets in clockwise order starting from center and then top
    // y-1,x+0 (top) → y-1,x+1 (top-right) → y+0,x+1 (right) →
    // y+1,x+1 (bottom-right) → y+1,x+0 (bottom) → y+1,x-1 (bottom-left) →
    // y+0,x-1 (left) → y-1,x-1 (top-left) → y+0,x+0 (center)
    const offsets = [
        { y: 0n, x: 0n }, // center (current zone)
        { y: -1n, x: 0n }, // top
        { y: -1n, x: 1n }, // top-right
        { y: 0n, x: 1n }, // right
        { y: 1n, x: 1n }, // bottom-right
        { y: 1n, x: 0n }, // bottom
        { y: 1n, x: -1n }, // bottom-left
        { y: 0n, x: -1n }, // left
        { y: -1n, x: -1n }, // top-left
    ];
    // Generate the zones based on the defined offsets
    const zones = offsets.map((offset) => {
        const newXZone = xZone + offset.x;
        const newYZone = yZone + offset.y;
        return new BN(((newYZone << 32n) | newXZone).toString());
    });
    return zones;
}
//# sourceMappingURL=index.js.map