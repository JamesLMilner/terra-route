import { Position } from "geojson";

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

/** Distance measured in kilometers */
export const haversineDistance = (pointOne: Position, pointTwo: Position): number => {
    const phiOne = pointOne[1] * DEG_TO_RAD;
    const lambdaOne = pointOne[0] * DEG_TO_RAD;
    const phiTwo = pointTwo[1] * DEG_TO_RAD;
    const lambdaTwo = pointTwo[0] * DEG_TO_RAD;
    const deltaPhi = phiTwo - phiOne;
    const deltalambda = lambdaTwo - lambdaOne;
    const sinDeltaPhi = Math.sin(deltaPhi / 2);
    const sinDeltaLambda = Math.sin(deltalambda / 2);

    const a =
        sinDeltaPhi * sinDeltaPhi +
        Math.cos(phiOne) *
        Math.cos(phiTwo) *
        sinDeltaLambda *
        sinDeltaLambda;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
}
