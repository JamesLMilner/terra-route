import { FeatureCollection, LineString } from 'geojson';
import { readFileSync } from 'fs';
import { graphGetUniqueSegments } from './unique-segments';
import { graphGetNodeAndEdgeCount } from './nodes';

describe('graphGetUniqueSegments', () => {
    it('should not change the properties of the graph', () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;

        const networkAfter = graphGetUniqueSegments(network)

        const afterNodeAndEdgeCount = graphGetNodeAndEdgeCount(networkAfter);
        expect(afterNodeAndEdgeCount).toEqual(graphGetNodeAndEdgeCount(network));
        expect(networkAfter.features.length).toEqual(afterNodeAndEdgeCount.edgeCount);
    });
});
