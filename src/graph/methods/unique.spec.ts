import { FeatureCollection, LineString } from 'geojson';
import { readFileSync } from 'fs';
import { graphGetUniqueSegments } from './unique';
import { graphGetNodeAndEdgeCount } from './nodes';
import { createFeatureCollection } from '../../test-utils/create';

describe('graphGetUniqueSegments', () => {
    it('returns an empty feature collection for empty input', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([]);
        const output = graphGetUniqueSegments(input);
        expect(output).toEqual(createFeatureCollection([]));
    });

    it('returns a single linestring for a single input linestring', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} }
        ]);
        const output = graphGetUniqueSegments(input);
        expect(output.features.length).toBe(1);
        expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
    });

    it('returns two linestrings for two unconnected linestrings', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[2, 2], [3, 3]] }, properties: {} }
        ]);
        const output = graphGetUniqueSegments(input);
        expect(output.features.length).toBe(2);
        expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        expect(output.features[1].geometry.coordinates).toEqual([[2, 2], [3, 3]]);
    });

    it('returns two linestrings for two connected linestrings', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[1, 1], [2, 2]] }, properties: {} }
        ]);
        const output = graphGetUniqueSegments(input);
        expect(output.features.length).toBe(2);
        expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        expect(output.features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
    });

    it('returns two linestrings if one is a subsection of the other', () => {
        const input: FeatureCollection<LineString> = createFeatureCollection([
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
            { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 2]] }, properties: {} }
        ]);
        const output = graphGetUniqueSegments(input);
        expect(output.features.length).toBe(2);
        expect(output.features[0].geometry.coordinates).toEqual([[0, 0], [1, 1]]);
        expect(output.features[1].geometry.coordinates).toEqual([[1, 1], [2, 2]]);
    });

    it('should not change the properties of the graph', () => {
        const network = JSON.parse(readFileSync('src/data/network.geojson', 'utf-8')) as FeatureCollection<LineString>;

        const networkAfter = graphGetUniqueSegments(network)

        const afterNodeAndEdgeCount = graphGetNodeAndEdgeCount(networkAfter);
        expect(afterNodeAndEdgeCount).toEqual(graphGetNodeAndEdgeCount(network));
        expect(networkAfter.features.length).toEqual(afterNodeAndEdgeCount.edgeCount);
    });
});
