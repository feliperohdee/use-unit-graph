import { describe, it, expect, beforeEach } from 'vitest';

import Node from './node';
import Edge from './edge';

describe('/node', () => {
	let node: Node;

	beforeEach(() => {
		node = new Node('testNode', { id: 1 });
	});

	describe('constructor', () => {
		it('should create a Node with the given entity and properties', () => {
			expect(node.entity).toBe('testNode');
			expect(node.properties).toEqual({ id: 1 });
			expect(node._uniqid_).toBe('');
		});

		it('should initialize empty edge arrays', () => {
			expect(node.edges).toEqual([]);
			expect(node.inputEdges).toEqual([]);
			expect(node.outputEdges).toEqual([]);
		});
	});

	describe('unlink', () => {
		it('should unlink all connected edges', () => {
			// Create another node to link to
			const otherNode = new Node('testNode', { id: 2 });

			// Create an edge and link the nodes
			const edge = new Edge('testEdge');
			edge.link(node, otherNode);

			// Verify the edge is connected
			expect(node.edges.length).toBe(1);
			expect(node.outputEdges.length).toBe(1);
			expect(otherNode.edges.length).toBe(1);
			expect(otherNode.inputEdges.length).toBe(1);

			// Unlink the node
			const result = node.unlink();

			// Verify the edge is unlinked
			expect(result).toBe(true);
			expect(node.edges.length).toBe(0);
			expect(node.outputEdges.length).toBe(0);
			expect(otherNode.edges.length).toBe(0);
			expect(otherNode.inputEdges.length).toBe(0);
		});
	});

	describe('toJSON', () => {
		it('should return an array with entity, properties, and uniqid', () => {
			const node = new Node('testNode', { id: 3 }, 'test-id');
			const json = node.toJSON();

			expect(json).toEqual(['testNode', { id: 3 }, 'test-id']);
		});
	});
});
