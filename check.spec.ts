import { describe, it, expect, beforeEach } from 'vitest';
import { Graph } from './graph';
import { Node } from './node';

describe('graph tracing and path finding', () => {
	let graph: Graph;
	let nodeA: Node;
	let nodeB: Node;
	let nodeC: Node;
	let nodeD: Node;
	let nodeE: Node;
	let nodeF: Node;
	let nodeZ: Node;
	let nodeY: Node;

	beforeEach(() => {
		graph = new Graph();

		// Create nodes
		graph.nodes('node').createIndex('name');

		nodeA = graph.createNode('node', { name: 'A' });
		nodeB = graph.createNode('node', { name: 'B' });
		nodeC = graph.createNode('node', { name: 'C' });
		nodeD = graph.createNode('node', { name: 'D' });
		nodeE = graph.createNode('node', { name: 'E' });
		nodeF = graph.createNode('node', { name: 'F' });
		nodeZ = graph.createNode('node', { name: 'Z' });
		nodeY = graph.createNode('node', { name: 'Y' });

		// Create edges
		graph.createEdge('edge').link(nodeA, nodeZ).setDistance(1);
		graph.createEdge('edge').link(nodeC, nodeY).setDistance(0.5);
		graph.createEdge('edge').link(nodeA, nodeB).setDistance(3);
		graph.createEdge('edge').link(nodeA, nodeC).setDistance(1);
		graph.createEdge('edge').link(nodeA, nodeD).setDistance(1);
		graph.createEdge('edge').link(nodeA, nodeE).setDistance(5);
		graph.createEdge('edge').link(nodeC, nodeF).setDistance(1);
	});

	describe('tracing paths', () => {
		it('should find a path between two nodes', () => {
			const path = graph.trace(nodeA, nodeE);

			expect(path.start()).toBe(nodeA);
			expect(path.end()).toBe(nodeE);
			expect(path.length()).toBe(1);
			expect(path.distance()).toBe(5);
		});
	});

	describe('finding closest nodes', () => {
		it('should find all closest nodes ordered by distance', () => {
			const paths = graph.closest(nodeA);

			// Check that we have paths
			expect(paths.length).toBeGreaterThan(0);

			// Check the order of paths by distance
			const distances = paths.map(p => p.distance());

			// Check that distances are in non-decreasing order
			for (let i = 1; i < distances.length; i++) {
				expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
			}

			// Check that all expected nodes are found
			const endNodes = paths.map(p => p.end().get('name'));
			expect(endNodes).toContain('B');
			expect(endNodes).toContain('C');
			expect(endNodes).toContain('D');
			expect(endNodes).toContain('E');
			expect(endNodes).toContain('F');
			expect(endNodes).toContain('Z');
		});
	});

	describe('serialization and deserialization', () => {
		it('should maintain graph structure after serialization and deserialization', () => {
			// Serialize and deserialize
			const json = graph.toJSON();
			const newGraph = new Graph().fromJSON(json);

			// Check node and edge counts
			expect(newGraph.nodeCount()).toBe(8);
			expect(newGraph.edgeCount()).toBe(7);

			// Check that we can find nodes by name
			const newNodeA = newGraph.nodes('node').find('name', 'A');
			expect(newNodeA).toBeDefined();

			// Check that paths still work
			if (newNodeA) {
				const newNodeE = newGraph.nodes('node').find('name', 'E');
				if (newNodeE) {
					const path = newGraph.trace(newNodeA as Node, newNodeE as Node);
					expect(path.distance()).toBe(5);
				}

				// Check closest paths
				const paths = newGraph.closest(newNodeA as Node);
				expect(paths.length).toBeGreaterThan(0);
			}
		});
	});

	describe('node properties', () => {
		it('should correctly get node properties', () => {
			expect(nodeA.get('name')).toBe('A');
			expect(nodeB.get('name')).toBe('B');
			expect(nodeC.get('name')).toBe('C');
		});
	});
});
