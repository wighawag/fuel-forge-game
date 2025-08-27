import { BN } from "fuels";
export declare const ENTRANCE: {
    x: number;
    y: number;
};
export declare function calculateZone(position: {
    x: number;
    y: number;
}): BN;
/**
 * Returns the current zone and 8 surrounding zones in clockwise order starting from center and then top
 * Order: center, top, top-right, right, bottom-right, bottom, bottom-left, left, top-left
 * With x axis moving from left to right and y from top to bottom
 */
export declare function calculateSurroundingZones(position: {
    x: number;
    y: number;
}): BN[];
//# sourceMappingURL=index.d.ts.map