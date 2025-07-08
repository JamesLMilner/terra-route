import { FeatureCollection, LineString, Feature, Position } from 'geojson'

/**
 * Are the two coordinate sequences exactly equal (in same order)?
 */
function areCoordinatesEqual(a: Position[], b: Position[]): boolean {
    if (a.length !== b.length) {
        return false
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) {
            return false
        }
    }

    return true
}

/**
 * Is `sub` a contiguous subsequence of `full`, either forward or reversed?
 */
function isSubsequence(sub: Position[], full: Position[]): boolean {
    const subLength = sub.length
    const fullLength = full.length

    if (subLength > fullLength) {
        return false
    }

    // check forward
    for (let start = 0; start <= fullLength - subLength; start++) {
        let matches = true

        for (let offset = 0; offset < subLength; offset++) {
            if (
                full[start + offset][0] !== sub[offset][0] ||
                full[start + offset][1] !== sub[offset][1]
            ) {
                matches = false
                break
            }
        }

        if (matches) {
            return true
        }
    }

    // check reversed
    const reversedSub = [...sub].reverse()

    for (let start = 0; start <= fullLength - subLength; start++) {
        let matches = true

        for (let offset = 0; offset < subLength; offset++) {
            if (
                full[start + offset][0] !== reversedSub[offset][0] ||
                full[start + offset][1] !== reversedSub[offset][1]
            ) {
                matches = false
                break
            }
        }

        if (matches) {
            return true
        }
    }

    return false
}

/**
 * Remove any LineString that is either
 *  - an exact duplicate of an earlier one, or
 *  - a contiguous subsequence (in either direction) of any other.
 */
export function removeDuplicateAndSubsectionLines(
    collection: FeatureCollection<LineString>
): FeatureCollection<LineString> {
    const features = collection.features
    const toRemove = new Set<number>()

    for (let i = 0; i < features.length; i++) {
        const coordsI = features[i].geometry.coordinates

        for (let j = 0; j < features.length; j++) {
            if (i === j) {
                continue
            }

            const coordsJ = features[j].geometry.coordinates

            // if coordsI are a subsequence of coordsJ, OR exactly equal,
            // then mark coordsI for removal—but only if
            //   • coordsI is strictly shorter than coordsJ, or
            //   • they’re the same length and this is the later duplicate (i > j)
            if (
                isSubsequence(coordsI, coordsJ) &&
                (
                    coordsI.length < coordsJ.length ||
                    (coordsI.length === coordsJ.length && i > j)
                )
            ) {
                toRemove.add(i)
                break
            }
        }
    }

    const filtered = features.filter((_, index) => !toRemove.has(index))
    return {
        type: 'FeatureCollection',
        features: filtered
    }
}
