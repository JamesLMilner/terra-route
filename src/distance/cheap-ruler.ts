import { Position } from "geojson";

// This code is based on Mapbox's cheap-ruler library:

// ISC License

// Copyright (c) 2024, Mapbox

// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.

// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.

/**
 * Creates a function for fast geodesic distance approximation using local scaling constants
 * based on a reference latitude. Useful for city-scale distances.
 *
 * @param {number} lat - Reference latitude in degrees
 * @returns {(a: Position, b: Position) => number} - Function that computes distance between two points
 * 
 * @example
 * const distance = createCheapRuler(50.5);
 * const d = distance([30.5, 50.5], [30.51, 50.49]);
 * 
 */
export function createCheapRuler(lat: number): (a: Position, b: Position) => number {
    const RE = 6378.137; // Earth's equatorial radius in kilometers
    const FE = 1 / 298.257223563; // Earth's flattening
    const E2 = FE * (2 - FE);
    const RAD = Math.PI / 180;

    const cosLat = Math.cos(lat * RAD);
    const w2 = 1 / (1 - E2 * (1 - cosLat * cosLat));
    const w = Math.sqrt(w2);

    const m = RAD * RE;
    const kx = m * w * cosLat;        // scale for longitude
    const ky = m * w * w2 * (1 - E2); // scale for latitude

    return function distance(a: Position, b: Position): number {
        let deltaLng = a[0] - b[0];

        while (deltaLng < -180) deltaLng += 360;
        while (deltaLng > 180) deltaLng -= 360;

        const dx = deltaLng * kx;
        const dy = (a[1] - b[1]) * ky;

        return Math.sqrt(dx * dx + dy * dy);
    };
}