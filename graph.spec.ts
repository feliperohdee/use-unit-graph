import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Graph } from './graph';
import { Node } from './node';
import { Edge } from './edge';
import { NodeCollection } from './node-collection';
import { EdgeCollection } from './edge-collection';
import { Path } from './path';
import * as fs from 'fs';
import * as zlib from 'zlib';

// Mock fs and zlib modules
vi.mock('fs');
vi.mock('zlib');

describe('/graph', () => {
	let graph: Graph;

	beforeEach(() => {
		graph = new Graph();
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with empty collections', () => {
			expect(graph.nodeCount()).toBe(0);
			expect(graph.edgeCount()).toBe(0);
		});
	});

	describe('createNode', () => {
		it('should create and return a new node', () => {
			const node = graph.createNode('person', { name: 'Alice' });

			expect(node).toBeInstanceOf(Node);
			expect(node.entity).toBe('person');
			expect(node.properties).toEqual({ name: 'Alice' });
			expect(node.__uniqid__).toBeTruthy();
			expect(graph.nodeCount()).toBe(1);
		});
	});

	describe('createEdge', () => {
		it('should create and return a new edge', () => {
			const edge = graph.createEdge('knows', { since: 2020 });

			expect(edge).toBeInstanceOf(Edge);
			expect(edge.entity).toBe('knows');
			expect(edge.properties).toEqual({ since: 2020 });
			expect(edge.__uniqid__).toBeTruthy();
			expect(graph.edgeCount()).toBe(1);
		});
	});

	describe('nodes', () => {
		it('should return a NodeCollection for the given entity', () => {
			const collection = graph.nodes('person');

			expect(collection).toBeInstanceOf(NodeCollection);
			expect(collection.name()).toBe('person');
		});

		it('should return the same collection for the same entity', () => {
			const collection1 = graph.nodes('person');
			const collection2 = graph.nodes('person');

			expect(collection1).toBe(collection2);
		});
	});

	describe('edges', () => {
		it('should return an EdgeCollection for the given entity', () => {
			const collection = graph.edges('knows');

			expect(collection).toBeInstanceOf(EdgeCollection);
			expect(collection.name()).toBe('knows');
		});

		it('should return the same collection for the same entity', () => {
			const collection1 = graph.edges('knows');
			const collection2 = graph.edges('knows');

			expect(collection1).toBe(collection2);
		});
	});

	describe('unit', () => {
		it('should return a unit by its uniqid', () => {
			const node = graph.createNode('person', { name: 'Alice' });
			const edge = graph.createEdge('knows', { since: 2020 });

			expect(graph.unit(node.__uniqid__)).toBe(node);
			expect(graph.unit(edge.__uniqid__)).toBe(edge);
		});

		it('should return undefined for non-existent uniqid', () => {
			expect(graph.unit('non-existent')).toBeUndefined();
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

	describe('toJSON and fromJSON', () => {
		beforeEach(() => {
			const nodeA = graph.createNode('person', { name: 'Alice' });
			const nodeB = graph.createNode('person', { name: 'Bob' });

			const edge = graph.createEdge('knows', { since: 2020 });
			edge.link(nodeA, nodeB);

			graph.nodes('person').createIndex('name');
		});

		it('should serialize and deserialize the graph', () => {
			const json = graph.toJSON();

			// Create a new graph and load the JSON
			const newGraph = new Graph();
			newGraph.fromJSON(json);

			// Check that the new graph has the same structure
			expect(newGraph.nodeCount()).toBe(2);
			expect(newGraph.edgeCount()).toBe(1);

			// Check that we can find nodes by their indices
			const alice = newGraph.nodes('person').find('name', 'Alice');
			const bob = newGraph.nodes('person').find('name', 'Bob');

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

	describe('save and load', () => {
		beforeEach(() => {
			const nodeA = graph.createNode('person', { name: 'Alice' });
			const nodeB = graph.createNode('person', { name: 'Bob' });

			const edge = graph.createEdge('knows', { since: 2020 });
			edge.link(nodeA, nodeB);
		});

		it('should save the graph to a file', () => {
			// Mock implementations
			const gzipMock = vi.spyOn(zlib, 'gzip').mockImplementation((data, callback: any) => {
				callback(null, Buffer.from('mocked-gzipped-data'));
			});

			const writeFileMock = vi.spyOn(fs, 'writeFile').mockImplementation((path, data, callback: any) => {
				callback(null);
			});

			// Call save
			const callback = vi.fn();
			graph.save('test.gz', callback);

			// Check that the mocks were called correctly
			expect(gzipMock).toHaveBeenCalled();
			expect(writeFileMock).toHaveBeenCalledWith('test.gz', expect.any(Buffer), expect.any(Function));
			expect(callback).toHaveBeenCalledWith(null);
		});

		it('should load the graph from a file', () => {
			// Mock implementations
			const readFileMock = vi.spyOn(fs, 'readFile').mockImplementation((path, callback: any) => {
				callback(null, Buffer.from('mocked-gzipped-data'));
			});

			const gunzipMock = vi.spyOn(zlib, 'gunzip').mockImplementation((data, callback: any) => {
				const jsonData = JSON.stringify({
					nodes: [['person', { name: 'Test' }, 'test-id']],
					edges: [],
					nodeCollections: [],
					edgeCollections: []
				});
				callback(null, Buffer.from(jsonData));
			});

			// Call load
			const callback = vi.fn();
			graph.load('test.gz', callback);

			// Check that the mocks were called correctly
			expect(readFileMock).toHaveBeenCalledWith('test.gz', expect.any(Function));
			expect(gunzipMock).toHaveBeenCalledWith(expect.any(Buffer), expect.any(Function));
			expect(callback).toHaveBeenCalledWith(null, graph);

			// Check that the graph was updated
			expect(graph.nodeCount()).toBe(1);
			expect(graph.edgeCount()).toBe(0);
			const testNode = graph.unit('test-id');
			expect(testNode).toBeDefined();
			expect(testNode?.get('name')).toBe('Test');
		});

		it('should handle errors when saving', () => {
			// Mock error
			vi.spyOn(zlib, 'gzip').mockImplementation((data, callback: any) => {
				callback(new Error('Gzip error'));
			});

			// Call save
			const callback = vi.fn();
			graph.save('test.gz', callback);

			// Check that the error was passed to the callback
			expect(callback).toHaveBeenCalledWith(expect.any(Error));
		});

		it('should handle errors when loading', () => {
			// Mock error
			vi.spyOn(fs, 'readFile').mockImplementation((path, callback: any) => {
				callback(new Error('Read error'));
			});

			// Call load
			const callback = vi.fn();
			graph.load('test.gz', callback);

			// Check that the error was passed to the callback
			expect(callback).toHaveBeenCalledWith(expect.any(Error));
		});
	});
});
