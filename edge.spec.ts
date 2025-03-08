import { describe, it, expect, beforeEach } from 'vitest';

import Edge from './edge';
import Node from './node';

describe('/edge', () => {
	let edge: Edge;
	let inputNode: Node;
	let outputNode: Node;

	beforeEach(() => {
		edge = new Edge('testEdge', { weight: 5 });
		inputNode = new Node('testNode', { id: 1 });
		outputNode = new Node('testNode', { id: 2 });
	});

	describe('constructor', () => {
		it('should create an Edge with the given entity and properties', () => {
			expect(edge.entity).toBe('testEdge');
			expect(edge.properties).toEqual({ weight: 5 });
			expect(edge.__uniqid__).toBe('');
		});

		it('should initialize with null nodes and default values', () => {
			expect(edge.inputNode).toBeNull();
			expect(edge.outputNode).toBeNull();
			expect(edge.duplex).toBe(false);
			expect(edge.distance).toBe(1);
		});
	});

	describe('link', () => {
		it('should link two nodes directionally', () => {
			edge.link(inputNode, outputNode);

			expect(edge.inputNode).toBe(inputNode);
			expect(edge.outputNode).toBe(outputNode);
			expect(edge.duplex).toBe(false);

			// Check node references
			expect(inputNode.edges).toContain(edge);
			expect(inputNode.outputEdges).toContain(edge);
			expect(inputNode.inputEdges).not.toContain(edge);

			expect(outputNode.edges).toContain(edge);
			expect(outputNode.inputEdges).toContain(edge);
			expect(outputNode.outputEdges).not.toContain(edge);
		});

		it('should link two nodes bidirectionally when duplex is true', () => {
			edge.link(inputNode, outputNode, true);

			expect(edge.inputNode).toBe(inputNode);
			expect(edge.outputNode).toBe(outputNode);
			expect(edge.duplex).toBe(true);

			// Check node references for bidirectional link
			expect(inputNode.edges).toContain(edge);
			expect(inputNode.inputEdges).toContain(edge);
			expect(inputNode.outputEdges).toContain(edge);

			expect(outputNode.edges).toContain(edge);
			expect(outputNode.inputEdges).toContain(edge);
			expect(outputNode.outputEdges).toContain(edge);
		});
	});

	describe('setDistance', () => {
		it('should set the distance property', () => {
			edge.setDistance(2.5);
			expect(edge.distance).toBe(2.5);

			edge.setDistance('3.5');
			expect(edge.distance).toBe(3.5);
		});
	});

	describe('setWeight', () => {
		it('should set the distance as inverse of weight', () => {
			edge.setWeight(2);
			expect(edge.distance).toBe(0.5); // 1/2

			edge.setWeight('4');
			expect(edge.distance).toBe(0.25); // 1/4
		});
	});

	describe('oppositeNode', () => {
		beforeEach(() => {
			edge.link(inputNode, outputNode);
		});

		it('should return the output node when given the input node', () => {
			expect(edge.oppositeNode(inputNode)).toBe(outputNode);
		});

		it('should return the input node when given the output node', () => {
			expect(edge.oppositeNode(outputNode)).toBe(inputNode);
		});

		it('should return undefined when given an unrelated node', () => {
			const unrelatedNode = new Node('testNode', { id: 3 });
			expect(edge.oppositeNode(unrelatedNode)).toBeUndefined();
		});
	});

	describe('unlink', () => {
		beforeEach(() => {
			edge.link(inputNode, outputNode);
		});

		it('should unlink the edge from both nodes', () => {
			const result = edge.unlink();

			expect(result).toBe(true);
			expect(edge.inputNode).toBeNull();
			expect(edge.outputNode).toBeNull();
			expect(edge.duplex).toBe(false);

			expect(inputNode.edges).not.toContain(edge);
			expect(inputNode.outputEdges).not.toContain(edge);

			expect(outputNode.edges).not.toContain(edge);
			expect(outputNode.inputEdges).not.toContain(edge);
		});

		it('should handle duplex edges correctly', () => {
			// Re-link as duplex
			edge.link(inputNode, outputNode, true);

			const result = edge.unlink();

			expect(result).toBe(true);
			expect(inputNode.inputEdges).not.toContain(edge);
			expect(outputNode.outputEdges).not.toContain(edge);
		});
	});

	describe('toJSON', () => {
		it('should return an array with edge data including node references', () => {
			edge.link(inputNode, outputNode);
			inputNode.__uniqid__ = 'input-id';
			outputNode.__uniqid__ = 'output-id';
			edge.__uniqid__ = 'edge-id';

			const json = edge.toJSON();

			expect(json).toEqual([
				'testEdge',
				{ weight: 5 },
				'edge-id',
				'input-id',
				'output-id',
				0, // duplex = false
				1 // distance
			]);
		});
	});
});
