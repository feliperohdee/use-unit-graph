import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import zlib, { gunzip } from 'zlib';

import Edge from './edge';
import EdgeCollection from './edge-collection';
import Graph from './graph';
import Node from './node';
import NodeCollection from './node-collection';
import Path from './path';

describe('/graph', () => {
	let graph: Graph;

	beforeEach(() => {
		graph = new Graph();
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with empty collections', () => {
			expect(graph.getNodeCount()).toBe(0);
			expect(graph.getEdgeCount()).toBe(0);
		});
	});

	describe('closest', () => {
		let nodeA: Node;
		let nodeB: Node;
		let nodeC: Node;
		let nodeD: Node;

		beforeEach(() => {
			nodeA = graph.createNode('person', { name: 'Alice' });
			nodeB = graph.createNode('person', { name: 'Bob' });
			nodeC = graph.createNode('person', { name: 'Charlie' });
			nodeD = graph.createNode('person', { name: 'David' });

			const edgeAB = graph.createEdge('knows');
			edgeAB.link(nodeA, nodeB).setDistance(1);

			const edgeBC = graph.createEdge('knows');
			edgeBC.link(nodeB, nodeC).setDistance(2);

			const edgeAD = graph.createEdge('knows');
			edgeAD.link(nodeA, nodeD).setDistance(3);
		});

		it('should find all paths from a node ordered by distance', () => {
			const paths = graph.closest(nodeA);

			// Check that we have paths
			expect(paths.length).toBeGreaterThan(0);

			// Check that distances are in non-decreasing order
			const distances = paths.map(p => p.distance());
			for (let i = 1; i < distances.length; i++) {
				expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
			}

			// Check that all expected nodes are found
			const endNodes = paths.map(p => p.end().get('name')).sort();
			expect(endNodes).toContain('Bob');
			expect(endNodes).toContain('Charlie');
			expect(endNodes).toContain('David');
		});

		it('should respect the count option', () => {
			const paths = graph.closest(nodeA, { count: 2 });

			expect(paths.length).toBe(2);
			// We don't check the exact order, just that we have 2 paths
		});

		it('should respect the direction option', () => {
			// Only outgoing edges
			const outPaths = graph.closest(nodeA, { direction: 1 });
			expect(outPaths.length).toBeGreaterThan(0);

			// Check that outPaths contains nodes reachable from nodeA
			const outPathNodes = outPaths.map(p => p.end().get('name')).sort();
			expect(outPathNodes).toContain('Bob');
			expect(outPathNodes).toContain('Charlie');
			expect(outPathNodes).toContain('David');
		});

		it('should respect the compare option', () => {
			// Only find nodes with name 'Bob' or 'David'
			const paths = graph.closest(nodeA, {
				compare: node => ['Bob', 'David'].includes(node.get('name'))
			});

			expect(paths).toHaveLength(2);
			expect(paths.map(p => p.end().get('name'))).toContain('Bob');
			expect(paths.map(p => p.end().get('name'))).toContain('David');
		});

		it('should respect the minDepth and maxDepth options', () => {
			// Only nodes at distance >= 2
			const minDepthPaths = graph.closest(nodeA, { minDepth: 2 });
			expect(minDepthPaths.length).toBeGreaterThan(0);

			// Get the names of the end nodes
			const endNodeNames = minDepthPaths.map(p => p.end().get('name'));

			// Check that the paths include Charlie and David
			expect(endNodeNames).toContain('Charlie');
			expect(endNodeNames).toContain('David');

			// Check that the paths don't include Bob (which is at distance 1)
			expect(endNodeNames).not.toContain('Bob');

			// Only nodes at distance <= 1
			const maxDepthPaths = graph.closest(nodeA, { maxDepth: 1 });
			expect(maxDepthPaths.length).toBeGreaterThan(0);

			// Check that the paths only include Bob
			expect(maxDepthPaths.map(p => p.end().get('name'))).toContain('Bob');
			expect(maxDepthPaths.map(p => p.end().get('name'))).not.toContain('Charlie');
			expect(maxDepthPaths.map(p => p.end().get('name'))).not.toContain('David');
		});
	});

	describe('createNode', () => {
		it('should create and return a new node', () => {
			const node = graph.createNode('person', { name: 'Alice' });

			expect(node).toBeInstanceOf(Node);
			expect(node.entity).toBe('person');
			expect(node.properties).toEqual({ name: 'Alice' });
			expect(node._uniqid_).toBeTruthy();
			expect(graph.getNodeCount()).toBe(1);
		});
	});

	describe('createEdge', () => {
		it('should create and return a new edge', () => {
			const edge = graph.createEdge('knows', { since: 2020 });

			expect(edge).toBeInstanceOf(Edge);
			expect(edge.entity).toBe('knows');
			expect(edge.properties).toEqual({ since: 2020 });
			expect(edge._uniqid_).toBeTruthy();
			expect(graph.getEdgeCount()).toBe(1);
		});
	});

	describe('getEdges', () => {
		it('should return an EdgeCollection for the given entity', () => {
			const collection = graph.getEdges('knows');

			expect(collection).toBeInstanceOf(EdgeCollection);
			expect(collection.name()).toBe('knows');
		});

		it('should return the same collection for the same entity', () => {
			const collection1 = graph.getEdges('knows');
			const collection2 = graph.getEdges('knows');

			expect(collection1).toBe(collection2);
		});
	});

	describe('getNodes', () => {
		it('should return a NodeCollection for the given entity', () => {
			const collection = graph.getNodes('person');

			expect(collection).toBeInstanceOf(NodeCollection);
			expect(collection.name()).toBe('person');
		});

		it('should return the same collection for the same entity', () => {
			const collection1 = graph.getNodes('person');
			const collection2 = graph.getNodes('person');

			expect(collection1).toBe(collection2);
		});
	});

	describe('getUnit', () => {
		it('should return a unit by its uniqid', () => {
			const node = graph.createNode('person', { name: 'Alice' });
			const edge = graph.createEdge('knows', { since: 2020 });

			expect(graph.getUnit(node._uniqid_)).toBe(node);
			expect(graph.getUnit(edge._uniqid_)).toBe(edge);
		});

		it('should return undefined for non-existent uniqid', () => {
			expect(graph.getUnit('non-existent')).toBeUndefined();
		});
	});

	describe('gzip and gunzip', () => {
		it('should gzip and gunzip a graph', async () => {
			const graph = new Graph();
			graph.createNode('person', { name: 'Alice' });

			const buffer = await graph.gzip(JSON.stringify(graph.toJSON()));
			const newGraph = new Graph();

			newGraph.fromJSON(await newGraph.gunzip(buffer));

			expect(graph.getNodeCount()).toBe(1);
			expect(graph.getEdgeCount()).toBe(0);

			expect(newGraph.getNodeCount()).toBe(1);
			expect(newGraph.getEdgeCount()).toBe(0);
		});
	});

	describe('save and load', () => {
		let readFile: Mock;
		let writeFile: Mock;

		beforeEach(() => {
			readFile = vi.fn();
			writeFile = vi.fn();
			graph = new Graph({ readFile, writeFile });

			const nodeA = graph.createNode('person', { name: 'Alice' });
			const nodeB = graph.createNode('person', { name: 'Bob' });
			const edge = graph.createEdge('knows', { since: 2020 });

			edge.link(nodeA, nodeB);
		});

		it('should save the graph to a file', async () => {
			await graph.save('test.gz');

			expect(writeFile).toHaveBeenCalledWith('test.gz', expect.any(Buffer));
		});

		it('should load the graph from a file', async () => {
			readFile.mockResolvedValue(await graph.gzip(JSON.stringify(graph.toJSON())));

			await graph.load('test.gz');

			// expect(readFile).toHaveBeenCalledWith('test.gz');
			expect(graph.getNodeCount()).toBe(2);
			expect(graph.getEdgeCount()).toBe(1);
		});
	});

	describe('toJSON and fromJSON', () => {
		beforeEach(() => {
			const nodeA = graph.createNode('person', { name: 'Alice' });
			const nodeB = graph.createNode('person', { name: 'Bob' });

			const edge = graph.createEdge('knows', { since: 2020 });
			edge.link(nodeA, nodeB);

			graph.getNodes('person').createIndex('name');
		});

		it('should serialize and deserialize the graph', () => {
			const json = graph.toJSON();

			// Create a new graph and load the JSON
			const newGraph = new Graph();
			newGraph.fromJSON(json);

			// Check that the new graph has the same structure
			expect(newGraph.getNodeCount()).toBe(2);
			expect(newGraph.getEdgeCount()).toBe(1);

			// Check that we can find nodes by their indices
			const alice = newGraph.getNodes('person').find('name', 'Alice');
			const bob = newGraph.getNodes('person').find('name', 'Bob');

			expect(alice).toBeDefined();
			expect(bob).toBeDefined();
			expect(alice?.get('name')).toBe('Alice');
			expect(bob?.get('name')).toBe('Bob');

			// Check that the edge is properly linked
			const aliceNode = alice as Node;
			expect(aliceNode.edges).toHaveLength(1);
			expect(aliceNode.outputEdges).toHaveLength(1);
		});
	});

	describe('toMermaid', () => {
		let nodeA: Node;
		let nodeB: Node;
		let nodeC: Node;
		let edgeAB: Edge;
		let edgeBC: Edge;
		let edgeDuplex: Edge;

		beforeEach(() => {
			nodeA = graph.createNode('person', { name: 'Alice', age: 30 });
			nodeB = graph.createNode('person', { name: 'Bob' });
			nodeC = graph.createNode('person', { name: 'Charlie' });

			edgeAB = graph.createEdge('knows');
			edgeAB.link(nodeA, nodeB).setDistance(1);

			edgeBC = graph.createEdge('knows');
			edgeBC.link(nodeB, nodeC).setDistance(2);

			edgeDuplex = graph.createEdge('friends');
			edgeDuplex.link(nodeA, nodeC, true).setDistance(3);
		});

		it('should generate valid Mermaid graph syntax', () => {
			const mermaidCode = graph.toMermaid();

			// Check that the output starts with the graph definition
			expect(mermaidCode).toMatch(/^graph TD\n/);

			// Check that all nodes are included
			expect(mermaidCode).toContain(`${nodeA._uniqid_}["person (name: Alice, age: 30)"]`);
			expect(mermaidCode).toContain(`${nodeB._uniqid_}["person (name: Bob)"]`);
			expect(mermaidCode).toContain(`${nodeC._uniqid_}["person (name: Charlie)"]`);

			// Check that all edges are included with correct syntax
			expect(mermaidCode).toContain(`${nodeA._uniqid_} --> |"knows (1)"|${nodeB._uniqid_}`);
			expect(mermaidCode).toContain(`${nodeB._uniqid_} --> |"knows (2)"|${nodeC._uniqid_}`);
			expect(mermaidCode).toContain(`${nodeA._uniqid_} <--> |"friends (3)"|${nodeC._uniqid_}`);
		});

		it('should handle nodes without properties', () => {
			const nodeD = graph.createNode('location', {});
			const mermaidCode = graph.toMermaid();

			expect(mermaidCode).toContain(`${nodeD._uniqid_}["location"]`);
		});

		it('should handle edges without entity names', () => {
			const nodeD = graph.createNode('location', { city: 'New York' });
			const edgeNoEntity = graph.createEdge('');
			edgeNoEntity.link(nodeA, nodeD).setDistance(5);

			const mermaidCode = graph.toMermaid();

			// Edge without entity name should not have a label
			expect(mermaidCode).toContain(`${nodeA._uniqid_} --> ${nodeD._uniqid_}`);
		});

		it('should handle a graph with no nodes or edges', () => {
			const emptyGraph = new Graph();
			const mermaidCode = emptyGraph.toMermaid();

			// Should still have the graph definition
			expect(mermaidCode).toBe('graph TD\n');
		});
	});

	describe('trace', () => {
		let nodeA: Node;
		let nodeB: Node;
		let nodeC: Node;
		let edgeAB: Edge;
		let edgeBC: Edge;

		beforeEach(() => {
			nodeA = graph.createNode('person', { name: 'Alice' });
			nodeB = graph.createNode('person', { name: 'Bob' });
			nodeC = graph.createNode('person', { name: 'Charlie' });

			edgeAB = graph.createEdge('knows');
			edgeAB.link(nodeA, nodeB);

			edgeBC = graph.createEdge('knows');
			edgeBC.link(nodeB, nodeC);
		});

		it('should find a path between two nodes', () => {
			const path = graph.trace(nodeA, nodeC);

			expect(path).toBeInstanceOf(Path);
			expect(path.start()).toBe(nodeA);
			expect(path.end()).toBe(nodeC);
			expect(path.length()).toBe(2);
		});

		it('should return an empty path if no path exists', () => {
			// Create an isolated node
			const nodeD = graph.createNode('person', { name: 'David' });

			const path = graph.trace(nodeA, nodeD);

			expect(path).toBeInstanceOf(Path);
			expect(path.length()).toBe(0);
		});

		it('should respect the direction parameter', () => {
			// Test with direction = 1 (outgoing only)
			const outPath = graph.trace(nodeA, nodeC, 1);
			expect(outPath.length()).toBe(2);

			// Test with direction = -1 (incoming only)
			const inPath = graph.trace(nodeC, nodeA, -1);
			expect(inPath.length()).toBe(2);

			// No path should exist from A to C using incoming edges only
			const noPath = graph.trace(nodeA, nodeC, -1);
			expect(noPath.length()).toBe(0);
		});
	});
});
