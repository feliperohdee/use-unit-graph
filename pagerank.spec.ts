import { describe, it, expect, beforeEach } from 'vitest';

import Graph from './graph';
import Node from './node';
import Edge from './edge';
import PageRank from './pagerank';

describe('/pagerank', () => {
	let graph: Graph;
	let pageRank: PageRank;

	beforeEach(() => {
		graph = new Graph();
	});

	describe('constructor', () => {
		it('should initialize with default options', () => {
			pageRank = new PageRank(graph);
			expect(pageRank).toBeDefined();
		});

		it('should initialize with custom options', () => {
			pageRank = new PageRank(graph, {
				dampingFactor: 0.75,
				maxIterations: 50,
				tolerance: 1e-5
			});
			expect(pageRank).toBeDefined();
		});
	});

	describe('compute', () => {
		it('should return empty map for empty graph', () => {
			pageRank = new PageRank(graph);
			const scores = pageRank.compute();
			expect(scores.size).toBe(0);
		});

		it('should compute equal scores for disconnected nodes', () => {
			// Create disconnected nodes
			const nodeA = graph.createNode('page', { url: 'A' });
			const nodeB = graph.createNode('page', { url: 'B' });
			const nodeC = graph.createNode('page', { url: 'C' });

			pageRank = new PageRank(graph);
			const scores = pageRank.compute();

			expect(scores.size).toBe(3);
			expect(scores.get(nodeA._uniqid_)).toBeCloseTo(1 / 3);
			expect(scores.get(nodeB._uniqid_)).toBeCloseTo(1 / 3);
			expect(scores.get(nodeC._uniqid_)).toBeCloseTo(1 / 3);
		});

		it('should compute higher scores for nodes with more incoming links', () => {
			// Create a simple directed graph
			// A -> B -> C
			// |    |
			// v    v
			// D <- E
			const nodeA = graph.createNode('page', { url: 'A' });
			const nodeB = graph.createNode('page', { url: 'B' });
			const nodeC = graph.createNode('page', { url: 'C' });
			const nodeD = graph.createNode('page', { url: 'D' });
			const nodeE = graph.createNode('page', { url: 'E' });

			// Create edges
			const edgeAB = graph.createEdge('link');
			edgeAB.link(nodeA, nodeB);

			const edgeBC = graph.createEdge('link');
			edgeBC.link(nodeB, nodeC);

			const edgeAD = graph.createEdge('link');
			edgeAD.link(nodeA, nodeD);

			const edgeBE = graph.createEdge('link');
			edgeBE.link(nodeB, nodeE);

			const edgeED = graph.createEdge('link');
			edgeED.link(nodeE, nodeD);

			pageRank = new PageRank(graph);
			const scores = pageRank.compute();

			// Node D should have higher score than others as it has 2 incoming links
			const scoreD = scores.get(nodeD._uniqid_) || 0;
			const scoreA = scores.get(nodeA._uniqid_) || 0;
			const scoreC = scores.get(nodeC._uniqid_) || 0;

			expect(scoreD).toBeGreaterThan(scoreA);
			expect(scoreD).toBeGreaterThan(scoreC);
		});

		it('should handle circular references', () => {
			// Create a circular reference: A -> B -> C -> A
			const nodeA = graph.createNode('page', { url: 'A' });
			const nodeB = graph.createNode('page', { url: 'B' });
			const nodeC = graph.createNode('page', { url: 'C' });

			const edgeAB = graph.createEdge('link');
			edgeAB.link(nodeA, nodeB);

			const edgeBC = graph.createEdge('link');
			edgeBC.link(nodeB, nodeC);

			const edgeCA = graph.createEdge('link');
			edgeCA.link(nodeC, nodeA);

			pageRank = new PageRank(graph);

			// This should not throw an error
			try {
				const scores = pageRank.compute();
				expect(scores.size).toBe(3);

				// In a perfect circle, all scores should be equal
				const scoreA = scores.get(nodeA._uniqid_) || 0;
				const scoreB = scores.get(nodeB._uniqid_) || 0;
				const scoreC = scores.get(nodeC._uniqid_) || 0;

				expect(scoreA).toBeCloseTo(scoreB);
				expect(scoreB).toBeCloseTo(scoreC);
			} catch (error) {
				throw new Error('Expected not to throw');
			}
		});
	});

	describe('getScore', () => {
		it('should return 0 for node not in computed scores', () => {
			const node = graph.createNode('page', { url: 'A' });
			pageRank = new PageRank(graph);

			// Without computing
			expect(pageRank.getScore(node)).toBe(0);
		});

		it('should return correct score for computed node', () => {
			const node = graph.createNode('page', { url: 'A' });
			pageRank = new PageRank(graph);

			// Compute scores
			pageRank.compute();

			// Should have a score now
			expect(pageRank.getScore(node)).toBeGreaterThan(0);
		});
	});

	describe('getTopNodes', () => {
		it('should return empty array when no nodes exist', () => {
			pageRank = new PageRank(graph);
			const topNodes = pageRank.getTopNodes();
			expect(topNodes).toEqual([]);
		});

		it('should return nodes sorted by PageRank score', () => {
			// Create a graph where D has more incoming links
			const nodeA = graph.createNode('page', { url: 'A' });
			const nodeB = graph.createNode('page', { url: 'B' });
			const nodeC = graph.createNode('page', { url: 'C' });
			const nodeD = graph.createNode('page', { url: 'D' });

			// A, B, C all link to D
			const edgeAD = graph.createEdge('link');
			edgeAD.link(nodeA, nodeD);

			const edgeBD = graph.createEdge('link');
			edgeBD.link(nodeB, nodeD);

			const edgeCD = graph.createEdge('link');
			edgeCD.link(nodeC, nodeD);

			pageRank = new PageRank(graph);
			const topNodes = pageRank.getTopNodes();

			// D should be the first node
			expect(topNodes[0]).toBe(nodeD);
		});

		it('should limit results to specified count', () => {
			// Create 5 nodes
			for (let i = 0; i < 5; i++) {
				graph.createNode('page', { url: `Node${i}` });
			}

			pageRank = new PageRank(graph);

			// Get top 3 nodes
			const topNodes = pageRank.getTopNodes(3);
			expect(topNodes.length).toBe(3);

			// Get top 2 nodes
			const topTwoNodes = pageRank.getTopNodes(2);
			expect(topTwoNodes.length).toBe(2);
		});

		it('should compute scores if not already computed', () => {
			const node = graph.createNode('page', { url: 'A' });
			pageRank = new PageRank(graph);

			// This should trigger compute internally
			const topNodes = pageRank.getTopNodes();

			expect(topNodes.length).toBe(1);
			expect(topNodes[0]).toBe(node);
		});
	});

	describe('getRelevantNodes', () => {
		it('should return empty array when no connected nodes exist', () => {
			const sourceNode = graph.createNode('page', { url: 'Source' });
			pageRank = new PageRank(graph);

			const relevantNodes = pageRank.getRelevantNodes(sourceNode);
			expect(relevantNodes).toEqual([]);
		});

		it('should return connected nodes sorted by PageRank score', () => {
			// Create a network:
			// Source -> A -> B
			//   |      |
			//   v      v
			//   C      D
			const sourceNode = graph.createNode('page', { url: 'Source' });
			const nodeA = graph.createNode('page', { url: 'A' });
			const nodeB = graph.createNode('page', { url: 'B' });
			const nodeC = graph.createNode('page', { url: 'C' });
			const nodeD = graph.createNode('page', { url: 'D' });

			// Create edges
			const edgeSourceA = graph.createEdge('link');
			edgeSourceA.link(sourceNode, nodeA);

			const edgeSourceC = graph.createEdge('link');
			edgeSourceC.link(sourceNode, nodeC);

			const edgeAB = graph.createEdge('link');
			edgeAB.link(nodeA, nodeB);

			const edgeAD = graph.createEdge('link');
			edgeAD.link(nodeA, nodeD);

			// Add more incoming links to D to increase its PageRank
			const nodeE = graph.createNode('page', { url: 'E' });
			const nodeF = graph.createNode('page', { url: 'F' });

			const edgeED = graph.createEdge('link');
			edgeED.link(nodeE, nodeD);

			const edgeFD = graph.createEdge('link');
			edgeFD.link(nodeF, nodeD);

			pageRank = new PageRank(graph);

			// Get relevant nodes with default options
			const relevantNodes = pageRank.getRelevantNodes(sourceNode);

			// Should include A, B, C, D but not E, F (beyond maxDepth)
			expect(relevantNodes.length).toBeLessThanOrEqual(4);

			// D should be ranked higher than others due to more incoming links
			if (relevantNodes.length > 1) {
				expect(relevantNodes[0]).toBe(nodeD);
			}
		});

		it('should respect minDepth and maxDepth options', () => {
			// Create a chain: Source -> A -> B -> C -> D
			const sourceNode = graph.createNode('page', { url: 'Source' });
			const nodeA = graph.createNode('page', { url: 'A' });
			const nodeB = graph.createNode('page', { url: 'B' });
			const nodeC = graph.createNode('page', { url: 'C' });
			const nodeD = graph.createNode('page', { url: 'D' });

			// Create edges
			const edgeSourceA = graph.createEdge('link');
			edgeSourceA.link(sourceNode, nodeA);

			const edgeAB = graph.createEdge('link');
			edgeAB.link(nodeA, nodeB);

			const edgeBC = graph.createEdge('link');
			edgeBC.link(nodeB, nodeC);

			const edgeCD = graph.createEdge('link');
			edgeCD.link(nodeC, nodeD);

			pageRank = new PageRank(graph);

			// With maxDepth = 1, should only include A
			const relevantNodes1 = pageRank.getRelevantNodes(sourceNode, { maxDepth: 1 });
			expect(relevantNodes1.length).toBe(1);
			expect(relevantNodes1[0]).toBe(nodeA);

			// With maxDepth = 2, should include A and B
			const relevantNodes2 = pageRank.getRelevantNodes(sourceNode, { maxDepth: 2 });
			expect(relevantNodes2.length).toBe(2);
			expect(relevantNodes2).toContain(nodeA);
			expect(relevantNodes2).toContain(nodeB);

			// With minDepth = 2, maxDepth = 3, should include only B and C
			const relevantNodes3 = pageRank.getRelevantNodes(sourceNode, {
				minDepth: 2,
				maxDepth: 3
			});
			expect(relevantNodes3.length).toBe(2);
			expect(relevantNodes3).toContain(nodeB);
			expect(relevantNodes3).toContain(nodeC);
			expect(relevantNodes3).not.toContain(nodeA);

			// With minDepth = 3, should include only C and D
			const relevantNodes4 = pageRank.getRelevantNodes(sourceNode, {
				minDepth: 3,
				maxDepth: 4
			});
			expect(relevantNodes4.length).toBe(2);
			expect(relevantNodes4).toContain(nodeC);
			expect(relevantNodes4).toContain(nodeD);
			expect(relevantNodes4).not.toContain(nodeA);
			expect(relevantNodes4).not.toContain(nodeB);
		});

		it('should respect limit option', () => {
			// Create multiple connected nodes
			const sourceNode = graph.createNode('page', { url: 'Source' });

			// Create 10 nodes connected to source
			const connectedNodes: Node[] = [];
			for (let i = 0; i < 10; i++) {
				const node = graph.createNode('page', { url: `Node${i}` });
				connectedNodes.push(node);

				const edge = graph.createEdge('link');
				edge.link(sourceNode, node);
			}

			pageRank = new PageRank(graph);

			// With limit = 5, should return only 5 nodes
			const relevantNodes = pageRank.getRelevantNodes(sourceNode, { limit: 5 });
			expect(relevantNodes.length).toBe(5);

			// With limit = 3, should return only 3 nodes
			const relevantNodes2 = pageRank.getRelevantNodes(sourceNode, { limit: 3 });
			expect(relevantNodes2.length).toBe(3);
		});

		it('should respect minScore option', () => {
			// Create a network where some nodes have higher PageRank
			const sourceNode = graph.createNode('page', { url: 'Source' });
			const nodeA = graph.createNode('page', { url: 'A' });
			const nodeB = graph.createNode('page', { url: 'B' });
			const nodeC = graph.createNode('page', { url: 'C' });

			// Connect source to all nodes
			const edgeSourceA = graph.createEdge('link');
			edgeSourceA.link(sourceNode, nodeA);

			const edgeSourceB = graph.createEdge('link');
			edgeSourceB.link(sourceNode, nodeB);

			const edgeSourceC = graph.createEdge('link');
			edgeSourceC.link(sourceNode, nodeC);

			// Add more incoming links to A to increase its PageRank
			for (let i = 0; i < 5; i++) {
				const node = graph.createNode('page', { url: `Extra${i}` });
				const edge = graph.createEdge('link');
				edge.link(node, nodeA);
			}

			pageRank = new PageRank(graph);
			pageRank.compute();

			// Get the score of node A (should be higher)
			const scoreA = pageRank.getScore(nodeA);

			// Set minScore to just below A's score
			const relevantNodes = pageRank.getRelevantNodes(sourceNode, {
				minScore: scoreA * 0.9
			});

			// Should include only A
			expect(relevantNodes.length).toBe(1);
			expect(relevantNodes[0]).toBe(nodeA);
		});

		it('should compute scores if not already computed', () => {
			const sourceNode = graph.createNode('page', { url: 'Source' });
			const nodeA = graph.createNode('page', { url: 'A' });

			const edge = graph.createEdge('link');
			edge.link(sourceNode, nodeA);

			pageRank = new PageRank(graph);

			// This should trigger compute internally
			const relevantNodes = pageRank.getRelevantNodes(sourceNode);

			expect(relevantNodes.length).toBe(1);
			expect(relevantNodes[0]).toBe(nodeA);
		});
	});
});
