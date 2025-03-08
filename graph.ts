import fs from 'fs';
import zlib from 'zlib';

import Edge from './edge';
import EdgeCollection from './edge-collection';
import Node from './node';
import NodeCollection from './node-collection';
import Path from './path';
import Unit from './unit';

type UnitLookup = { [key: string]: Unit };
type NodeCollections = { [key: string]: NodeCollection };
type EdgeCollections = { [key: string]: EdgeCollection };
type TracedPath = { [key: string]: (Node | Edge)[] };

type SearchOptions = {
	compare?: (node: Node) => boolean;
	count?: number;
	direction?: number;
	minDepth?: number;
	maxDepth?: number;
};

class Graph {
	private __uniqval__: number;
	private _lookup: UnitLookup = Object.create(null);
	private _nodes: Node[] = [];
	private _edges: Edge[] = [];
	private _nodeCollections: NodeCollections = Object.create(null);
	private _edgeCollections: EdgeCollections = Object.create(null);

	constructor() {
		this.__uniqval__ = Number.MAX_SAFE_INTEGER;
		this.__init__();
	}

	private __init__(): void {
		this._lookup = Object.create(null);
		this._nodes = [];
		this._edges = [];
		this._nodeCollections = Object.create(null);
		this._edgeCollections = Object.create(null);
	}

	unit(uniqid: string): Unit | undefined {
		return this._lookup[uniqid];
	}

	nodeCount(): number {
		return this._nodes.length;
	}

	edgeCount(): number {
		return this._edges.length;
	}

	createNode(entity: string, properties?: { [key: string]: any }): Node {
		return this._createNode(entity, properties, (this.__uniqval__--).toString(16));
	}

	private _createNode(entity: string, properties?: { [key: string]: any }, uniqid?: string): Node {
		return this._addNode(new Node(entity, properties, uniqid));
	}

	private _addNode(node: Node): Node {
		this._nodes.push(node);
		this._lookup[node.__uniqid__] = node;
		const nodeList = this.nodes(node.entity);
		return nodeList._add(node) as Node;
	}

	createEdge(entity: string, properties?: { [key: string]: any }): Edge {
		return this._createEdge(entity, properties, (this.__uniqval__--).toString(16));
	}

	private _createEdge(entity: string, properties?: { [key: string]: any }, uniqid?: string): Edge {
		return this._addEdge(new Edge(entity, properties, uniqid));
	}

	private _addEdge(edge: Edge): Edge {
		this._edges.push(edge);
		this._lookup[edge.__uniqid__] = edge;
		const edgeList = this.edges(edge.entity);
		return edgeList._add(edge) as Edge;
	}

	nodes(entity: string): NodeCollection {
		return this._nodeCollections[entity] || (this._nodeCollections[entity] = new NodeCollection(entity));
	}

	edges(entity: string): EdgeCollection {
		return this._edgeCollections[entity] || (this._edgeCollections[entity] = new EdgeCollection(entity));
	}

	private _getPath(node: Node, traced: TracedPath): (Node | Edge)[] {
		let path = traced[node.__uniqid__];

		while (path[0] instanceof Edge) {
			const edge = path[0] as Edge;
			const nextNode = edge.oppositeNode(path[1] as Node) as Node;
			path = traced[nextNode.__uniqid__].concat(path);
		}

		return path;
	}

	closest(node: Node, opts: SearchOptions = {}): Path[] {
		return this._search(node, opts.compare, opts.count, opts.direction, opts.minDepth, opts.maxDepth);
	}

	trace(fromNode: Node, toNode: Node, direction?: number): Path {
		const passCondition = function (node: Node): boolean {
			return node === toNode;
		};

		return this._search(fromNode, passCondition, 1, direction)[0] || new Path([]);
	}

	private _search(
		node: Node,
		passCondition?: (node: Node) => boolean,
		count?: number,
		direction?: number,
		minDepth?: number,
		maxDepth?: number
	): Path[] {
		const finalPassCondition =
			typeof passCondition === 'function'
				? passCondition
				: function (node: Node): boolean {
						return true;
					};

		const finalDirection = (direction || 0) | 0;
		const finalCount = Math.max(0, (count || 0) | 0);
		const finalMinDepth = Math.max(0, (minDepth || 0) | 0);
		const finalMaxDepth = Math.max(0, (maxDepth || 0) | 0);

		const nodePath: TracedPath = Object.create(null);
		nodePath[node.__uniqid__] = [node];

		const depthMap = new Map<number, Node[]>();
		depthMap.set(0, [node]);

		const depthList: number[] = [0];

		const found: Path[] = [];
		const getPath = this._getPath.bind(this);

		function enqueue(node: Node, depth: number): void {
			depthMap.has(depth) ? depthMap.get(depth)!.push(node) : depthMap.set(depth, [node]);
			orderedSetInsert(depthList, depth);
		}

		function orderedSetInsert(arr: number[], val: number): number[] {
			let n = arr.length;
			let i = n >>> 1;

			while (n) {
				n >>>= 1;
				if (arr[i] === val) {
					return arr;
				} else if (arr[i] < val) {
					i += n;
				} else {
					i -= n;
				}
			}

			return arr.splice(i + (arr[i] < val ? 1 : 0), 0, val);
		}

		function readNode(node: Node, curDepth: number): Path | false {
			const edges = finalDirection === 0 ? node.edges : finalDirection > 0 ? node.outputEdges : node.inputEdges;

			for (let i = 0, len = edges.length; i < len; i++) {
				const edge = edges[i];
				const depth = curDepth + edge.distance;

				if (finalMaxDepth && depth > finalMaxDepth) {
					continue;
				}

				const tnode = edges[i].oppositeNode(node) as Node;

				if (!nodePath[tnode.__uniqid__]) {
					nodePath[tnode.__uniqid__] = [edge, tnode];
					enqueue(tnode, depth);
				}
			}

			if (curDepth >= finalMinDepth && finalPassCondition(node)) {
				return new Path(getPath(node, nodePath));
			}

			return false;
		}

		while (depthList.length) {
			const curDepth = depthList.shift() as number;
			const queue = depthMap.get(curDepth) as Node[];

			while (queue.length) {
				const path = readNode(queue.shift() as Node, curDepth);
				path && found.push(path);

				if (finalCount && found.length >= finalCount) {
					return found;
				}
			}
		}

		return found;
	}

	toJSON(): any {
		const nodeCollections = this._nodeCollections;
		const nc = Object.keys(nodeCollections).map(function (entity) {
			return nodeCollections[entity].toJSON();
		});

		const edgeCollections = this._edgeCollections;
		const ec = Object.keys(edgeCollections).map(function (entity) {
			return edgeCollections[entity].toJSON();
		});

		const nodes = this._nodes.map(function (node) {
			return node.toJSON();
		});

		const edges = this._edges.map(function (edge) {
			return edge.toJSON();
		});

		return {
			nodes: nodes,
			edges: edges,
			nodeCollections: nc,
			edgeCollections: ec
		};
	}

	fromJSON(json: any): this {
		this.__init__();

		const nodes = json.nodes || [];
		const edges = json.edges || [];
		const nodeCollections = json.nodeCollections || [];
		const edgeCollections = json.edgeCollections || [];

		for (let i = 0, len = nodes.length; i < len; i++) {
			const node = nodes[i];
			this._createNode(node[0], node[1], node[2]);
		}

		for (let i = 0, len = edges.length; i < len; i++) {
			const edge = edges[i];
			const e = this._createEdge(edge[0], edge[1], edge[2]);
			const inputNode = this.unit(edge[3]) as Node;
			const outputNode = this.unit(edge[4]) as Node;
			e.link(inputNode, outputNode, !!edge[5]).setDistance(edge[6]);
		}

		for (let i = 0, len = nodeCollections.length; i < len; i++) {
			const collection = nodeCollections[i];
			this.nodes(collection[0]).createIndices(collection[1]);
		}

		for (let i = 0, len = edgeCollections.length; i < len; i++) {
			const collection = edgeCollections[i];
			this.edges(collection[0]).createIndices(collection[1]);
		}

		return this;
	}

	gzip(callback: (err: Error | null, buffer?: Buffer) => void): void {
		const json = JSON.stringify(this.toJSON());
		zlib.gzip(Buffer.from(json), callback);
	}

	gunzip(buffer: Buffer, callback: (err: Error | null, graph?: Graph) => void): void {
		zlib.gunzip(buffer, (err: Error | null, result: Buffer) => {
			if (err) {
				return callback(err);
			}

			try {
				const json = JSON.parse(result.toString());
				this.fromJSON(json);
				callback(null, this);
			} catch (e) {
				callback(e as Error);
			}
		});
	}

	save(filename: string, callback: (err: Error | null) => void): void {
		this.gzip((err, buffer) => {
			if (err) {
				return callback(err);
			}

			fs.writeFile(filename, buffer as Buffer, callback);
		});
	}

	load(filename: string, callback: (err: Error | null, graph?: Graph) => void): void {
		fs.readFile(filename, (err: Error | null, buffer: Buffer) => {
			if (err) {
				return callback(err);
			}

			this.gunzip(buffer, callback);
		});
	}
}

export default Graph;
