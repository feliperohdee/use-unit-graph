import { describe, it, expect, beforeEach } from 'vitest';
import HybridSearch from './graph-hybrid-search';
import Graph from './graph';
import Node from './node';
import Edge from './edge';
import Path from './path';

describe('/graph-hybrid-search', () => {
	let hybridSearch: HybridSearch;
	let graph: Graph;
	let nodeA: Node;
	let nodeB: Node;
	let nodeC: Node;
	let nodeD: Node;
	let nodeE: Node;
	let edgeAB: Edge;
	let edgeBC: Edge;
	let edgeCD: Edge;
	let edgeAE: Edge;
	let edgeED: Edge;

	beforeEach(() => {
		hybridSearch = new HybridSearch();
		graph = new Graph();

		// Create test nodes
		nodeA = graph.createNode('person', { name: 'A' });
		nodeB = graph.createNode('person', { name: 'B' });
		nodeC = graph.createNode('person', { name: 'C' });
		nodeD = graph.createNode('person', { name: 'D' });
		nodeE = graph.createNode('person', { name: 'E' });

		// Create edges with different distances
		edgeAB = graph.createEdge('knows');
		edgeBC = graph.createEdge('knows');
		edgeCD = graph.createEdge('knows');
		edgeAE = graph.createEdge('knows');
		edgeED = graph.createEdge('knows');

		// Set distances
		edgeAB.distance = 1;
		edgeBC.distance = 2;
		edgeCD.distance = 1;
		edgeAE.distance = 1;
		edgeED.distance = 3;

		// Connect nodes
		edgeAB.link(nodeA, nodeB);
		edgeBC.link(nodeB, nodeC);
		edgeCD.link(nodeC, nodeD);
		edgeAE.link(nodeA, nodeE);
		edgeED.link(nodeE, nodeD);
	});

	describe('_buildPath', () => {
		it('should build a path from traced nodes', () => {
			// Create a traced path object
			const traced = {
				[nodeD._uniqid_]: [edgeCD, nodeD],
				[nodeC._uniqid_]: [edgeBC, nodeC],
				[nodeB._uniqid_]: [edgeAB, nodeB],
				[nodeA._uniqid_]: [nodeA]
			};

			// @ts-ignore - accessing private method for testing
			const path = hybridSearch._buildPath(nodeD, traced);

			expect(path).toBeInstanceOf(Path);
			expect(path.length()).toBe(3); // The length() method returns the number of nodes, not the total elements
			expect(path.start()).toBe(nodeA);
			expect(path.end()).toBe(nodeD);
		});
	});

	describe('_hybridSearch', () => {
		it('should find paths with default parameters', () => {
			const paths = hybridSearch.search(nodeA, () => true, 0, 0, 0, 0) as Path[];

			expect(paths).toBeInstanceOf(Array);
			expect(paths.length).toBeGreaterThan(0);

			// All paths should start from nodeA
			paths.forEach(path => {
				expect(path.start()).toBe(nodeA);
			});
		});

		it('should respect the count parameter', () => {
			const paths = hybridSearch.search(nodeA, () => true, 2, 0, 0, 0) as Path[];

			expect(paths.length).toBeLessThanOrEqual(2);
		});

		it('should respect the direction parameter for outgoing edges', () => {
			const paths = hybridSearch.search(nodeA, () => true, 0, 1, 0, 0) as Path[];

			// All paths should follow outgoing edges from nodeA
			paths.forEach(path => {
				const pathElements = (path as any)._raw;
				if (pathElements.length > 1) {
					const edge = pathElements[1] as Edge;
					expect(edge.inputNode).toBe(nodeA);
				}
			});
		});

		it('should respect the direction parameter for incoming edges', () => {
			// Create an incoming edge to nodeA
			const nodeZ = graph.createNode('person', { name: 'Z' });
			const edgeZA = graph.createEdge('knows');
			edgeZA.link(nodeZ, nodeA);

			const paths = hybridSearch.search(nodeA, () => true, 0, -1, 0, 0) as Path[];

			// Should find paths following incoming edges to nodeA
			const hasIncomingPath = paths.some(path => {
				const pathElements = (path as any)._raw;
				if (pathElements.length > 1) {
					const edge = pathElements[1] as Edge;
					return edge.outputNode === nodeA;
				}
				return false;
			});

			expect(hasIncomingPath).toBe(true);
		});

		it('should respect the minDepth parameter', () => {
			const paths = hybridSearch.search(nodeA, () => true, 0, 0, 2, 0) as Path[];

			// All paths should have a distance of at least 2
			paths.forEach(path => {
				expect(path.distance()).toBeGreaterThanOrEqual(2);
			});
		});

		it('should respect the maxDepth parameter', () => {
			const paths = hybridSearch.search(nodeA, () => true, 0, 0, 0, 3) as Path[];

			// All paths should have a distance of at most 3
			paths.forEach(path => {
				expect(path.distance()).toBeLessThanOrEqual(3);
			});
		});

		it('should use the passCondition to filter nodes', () => {
			const passCondition = (node: Node) => {
				return node.properties.name === 'D';
			};

			const paths = hybridSearch.search(nodeA, passCondition, 0, 0, 0, 0) as Path[];

			// All paths should end with nodeD
			paths.forEach(path => {
				expect(path.end()).toBe(nodeD);
			});
		});

		it('should prioritize paths based on distance and connections', () => {
			// Create a more connected node
			const nodeF = graph.createNode('person', { name: 'F' });

			graph.createEdge('knows').link(nodeF, nodeA);

			const node1 = graph.createNode('person', { name: '1' });
			const node2 = graph.createNode('person', { name: '2' });
			const node3 = graph.createNode('person', { name: '3' });

			graph.createEdge('knows').link(nodeF, node1);
			graph.createEdge('knows').link(nodeF, node2);
			graph.createEdge('knows').link(nodeF, node3);

			const paths = hybridSearch.search(nodeA, () => true, 2, 0, 1, 1) as Path[];

			// The first path should be to nodeF due to its higher connection count
			// and the same distance as other direct connections
			expect(paths[0].end()).toBe(nodeF);
		});

		it('should handle cycles in the graph', () => {
			// Create a cycle
			const edgeDA = graph.createEdge('knows');
			edgeDA.link(nodeD, nodeA);

			try {
				const paths = hybridSearch.search(nodeA, () => true, 10, 0, 0, 10) as Path[];

				// Should not get stuck in an infinite loop
				expect(paths.length).toBeGreaterThan(0);
			} catch (err) {
				// Should not throw an error
				expect(err).toBeUndefined();
			}
		});

		it('should use default passCondition when none is provided', () => {
			const paths = hybridSearch.search(nodeA, undefined, 0, 0, 0, 0) as Path[];

			// Should find paths to all nodes
			expect(paths.length).toBeGreaterThan(0);

			// Verify that paths to all nodes are found
			const foundNodes = new Set<Node>();

			paths.forEach(path => {
				foundNodes.add(path.end() as Node);
			});

			// Should find paths to all nodes in the graph
			expect(foundNodes.size).toBeGreaterThanOrEqual(4); // At least nodeA, nodeB, nodeC, nodeD
		});
	});
});
