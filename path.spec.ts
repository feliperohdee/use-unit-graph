import { describe, it, expect, beforeEach } from 'vitest';
import { Path } from './path';
import { Node } from './node';
import { Edge } from './edge';

describe('/path', () => {
	let nodeA: Node;
	let nodeB: Node;
	let nodeC: Node;
	let edgeAB: Edge;
	let edgeBC: Edge;
	let path: Path;

	beforeEach(() => {
		nodeA = new Node('person', { name: 'Alice' });
		nodeB = new Node('person', { name: 'Bob' });
		nodeC = new Node('person', { name: 'Charlie' });

		edgeAB = new Edge('knows');
		edgeAB.link(nodeA, nodeB);
		edgeAB.setDistance(2);

		edgeBC = new Edge('knows');
		edgeBC.link(nodeB, nodeC);
		edgeBC.setDistance(3);

		path = new Path([nodeA, edgeAB, nodeB, edgeBC, nodeC]);
	});

	describe('constructor', () => {
		it('should create a Path with the given array of elements', () => {
			expect(path['_raw']).toHaveLength(5);
			expect(path['_raw'][0]).toBe(nodeA);
			expect(path['_raw'][1]).toBe(edgeAB);
			expect(path['_raw'][2]).toBe(nodeB);
			expect(path['_raw'][3]).toBe(edgeBC);
			expect(path['_raw'][4]).toBe(nodeC);
		});
	});

	describe('start', () => {
		it('should return the first element in the path', () => {
			expect(path.start()).toBe(nodeA);
		});
	});

	describe('end', () => {
		it('should return the last element in the path', () => {
			expect(path.end()).toBe(nodeC);
		});
	});

	describe('length', () => {
		it('should return the number of edges in the path', () => {
			expect(path.length()).toBe(2);
		});

		it('should return 0 for a path with only one node', () => {
			const singleNodePath = new Path([nodeA]);
			expect(singleNodePath.length()).toBe(0);
		});
	});

	describe('distance', () => {
		it('should return the sum of edge distances', () => {
			expect(path.distance()).toBe(5); // 2 + 3
		});

		it('should return 0 for a path with no edges', () => {
			const singleNodePath = new Path([nodeA]);
			expect(singleNodePath.distance()).toBe(0);
		});
	});

	describe('prettify', () => {
		it('should return a string representation of the path with directional indicators', () => {
			const pretty = path.prettify();
			expect(pretty).toContain('Alice');
			expect(pretty).toContain('Bob');
			expect(pretty).toContain('Charlie');
			expect(pretty).toContain('>>'); // Directional indicators
		});

		it('should handle duplex edges correctly', () => {
			// Create a duplex edge
			const duplexEdge = new Edge('friends');
			duplexEdge.link(nodeA, nodeB, true);

			const duplexPath = new Path([nodeA, duplexEdge, nodeB]);
			const pretty = duplexPath.prettify();

			expect(pretty).toContain('<>'); // Bidirectional indicators
		});
	});

	describe('toString', () => {
		it('should return the same as prettify', () => {
			expect(path.toString()).toBe(path.prettify());
		});
	});
});
