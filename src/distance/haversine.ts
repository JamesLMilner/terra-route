import { Position } from "geojson";

/** Distance measured in kilometers */
export const haversineDistance = (pointOne: Position, pointTwo: Position): number => {
    const toRadians = (latOrLng: number) => (latOrLng * Math.PI) / 180;

    const phiOne = toRadians(pointOne[1]);
    const lambdaOne = toRadians(pointOne[0]);
    const phiTwo = toRadians(pointTwo[1]);
    const lambdaTwo = toRadians(pointTwo[0]);
    const deltaPhi = phiTwo - phiOne;
    const deltalambda = lambdaTwo - lambdaOne;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phiOne) *
        Math.cos(phiTwo) *
        Math.sin(deltalambda / 2) *
        Math.sin(deltalambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const radius = 6371e3;
    const distance = radius * c;


    // Convert distance from meters to kilometers
    return distance / 1000;
}
