import zlib from 'zlib';

import Edge from './edge';
import EdgeCollection from './edge-collection';
import HybridSearch from './graph-hybrid-search';
import Node from './node';
import NodeCollection from './node-collection';
import PageRank from './pagerank';
import Path from './path';
import Unit from './unit';

type Algorithm = 'hybrid' | 'dijkstra' | 'pagerank';
type EdgeCollections = { [key: string]: EdgeCollection };
type NodeCollections = { [key: string]: NodeCollection };
type Readfile = (filename: string) => Promise<Buffer>;
type TracedPath = { [key: string]: (Node | Edge)[] };
type UnitLookup = { [key: string]: Unit };
type Writefile = (filename: string, data: Buffer) => Promise<void>;

type GraphOptions = {
	readFile?: Readfile;
	writeFile?: Writefile;
};

type SearchOptions = {
	algorithm?: Algorithm;
	compare?: ((node: Node) => boolean) | undefined;
	count?: number;
	direction?: number;
	maxDepth?: number;
	minDepth?: number;
};

class Graph {
	private _uniqval_: number;
	private edgeCollections: EdgeCollections = Object.create(null);
	private edges: Edge[] = [];
	private lookup: UnitLookup = Object.create(null);
	private nodeCollections: NodeCollections = Object.create(null);
	private nodes: Node[] = [];
	private readFile: Readfile | null = null;
	private writeFile: Writefile | null = null;

	constructor(options: GraphOptions = {}) {
		this._uniqval_ = Number.MAX_SAFE_INTEGER;
		this.init();

		this.readFile = options.readFile || null;
		this.writeFile = options.writeFile || null;
	}

	private init(): void {
		this.lookup = Object.create(null);
		this.nodes = [];
		this.edges = [];
		this.nodeCollections = Object.create(null);
		this.edgeCollections = Object.create(null);
	}

	private addNode(node: Node): Node {
		this.nodes.push(node);
		this.lookup[node._uniqid_] = node;

		const nodeList = this.getNodes(node.entity);
		return nodeList._add(node) as Node;
	}

	private addEdge(edge: Edge): Edge {
		this.edges.push(edge);
		this.lookup[edge._uniqid_] = edge;
		const edgeList = this.getEdges(edge.entity);
		return edgeList._add(edge) as Edge;
	}

	closest(node: Node, opts: SearchOptions = {}): Path[] {
		if (opts.algorithm === 'hybrid') {
			const hybridSearch = new HybridSearch();

			return hybridSearch.search(node, opts.compare, opts.count, opts.direction, opts.minDepth, opts.maxDepth) as Path[];
		} else if (opts.algorithm === 'pagerank') {
			const pagerank = new PageRank(this);
			
			return pagerank.getRelevantNodes(node, {
				limit: opts.count,
				maxDepth: opts.maxDepth,
				minDepth: opts.minDepth,
				minScore: 0
			}).map(node => {
				return new Path([node]);
			});
		}

		return this.search(node, opts.compare, opts.count, opts.direction, opts.minDepth, opts.maxDepth);
	}

	private _createEdge(entity: string, properties?: { [key: string]: any }, uniqid?: string): Edge {
		return this.addEdge(new Edge(entity, properties, uniqid));
	}

	createEdge(entity: string, properties?: { [key: string]: any }): Edge {
		return this._createEdge(entity, properties, (this._uniqval_--).toString(16));
	}

	private _createNode(entity: string, properties?: { [key: string]: any }, uniqid?: string): Node {
		return this.addNode(new Node(entity, properties, uniqid));
	}

	createNode(entity: string, properties?: { [key: string]: any }): Node {
		return this._createNode(entity, properties, (this._uniqval_--).toString(16));
	}

	fromJSON(json: any): this {
		this.init();

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
			const inputNode = this.getUnit(edge[3]) as Node;
			const outputNode = this.getUnit(edge[4]) as Node;
			e.link(inputNode, outputNode, !!edge[5]).setDistance(edge[6]);
		}

		for (let i = 0, len = nodeCollections.length; i < len; i++) {
			const collection = nodeCollections[i];
			this.getNodes(collection[0]).createIndices(collection[1]);
		}

		for (let i = 0, len = edgeCollections.length; i < len; i++) {
			const collection = edgeCollections[i];
			this.getEdges(collection[0]).createIndices(collection[1]);
		}

		return this;
	}

	async gunzip(buffer: Buffer): Promise<any> {
		return new Promise((resolve, reject) => {
			zlib.gunzip(buffer, (err: Error | null, result: Buffer) => {
				if (err) {
					return reject(err);
				}

				try {
					resolve(JSON.parse(result.toString()));
				} catch (err) {
					reject(err as Error);
				}
			});
		});
	}

	async gzip(graph: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			zlib.gzip(Buffer.from(graph), (err: Error | null, result: Buffer) => {
				if (err) {
					return reject(err);
				}

				resolve(result);
			});
		});
	}

	getEdgeCount(): number {
		return this.edges.length;
	}

	getEdges(entity: string): EdgeCollection {
		return this.edgeCollections[entity] || (this.edgeCollections[entity] = new EdgeCollection(entity));
	}

	getNodes(entity: string): NodeCollection {
		return this.nodeCollections[entity] || (this.nodeCollections[entity] = new NodeCollection(entity));
	}

	getNodeCount(): number {
		return this.nodes.length;
	}

	private getPath(node: Node, traced: TracedPath): (Node | Edge)[] {
		let path = traced[node._uniqid_];

		while (path[0] instanceof Edge) {
			const edge = path[0] as Edge;
			const nextNode = edge.oppositeNode(path[1] as Node) as Node;
			path = traced[nextNode._uniqid_].concat(path);
		}

		return path;
	}

	getUnit(uniqid: string): Unit | undefined {
		return this.lookup[uniqid];
	}

	async load(filename: string): Promise<void> {
		if (!this.readFile) {
			return this.init();
		}

		const buffer = await this.readFile(filename);
		const json = await this.gunzip(buffer);

		this.fromJSON(json);
	}

	async save(filename: string): Promise<void> {
		if (!this.writeFile) {
			return;
		}

		const buffer = await this.gzip(JSON.stringify(this.toJSON()));
		await this.writeFile(filename, buffer);
	}

	private search(
		node: Node,
		passCondition?: ((node: Node) => boolean) | undefined,
		count?: number,
		direction?: number,
		minDepth?: number,
		maxDepth?: number
	): Path[] {
		const finalPassCondition = typeof passCondition === 'function' ? passCondition : () => true;
		const finalDirection = (direction || 0) | 0;
		const finalCount = Math.max(0, (count || 0) | 0);
		const finalMinDepth = Math.max(0, (minDepth || 0) | 0);
		const finalMaxDepth = Math.max(0, (maxDepth || 0) | 0);

		const nodePath: TracedPath = Object.create(null);
		nodePath[node._uniqid_] = [node];

		const depthMap = new Map<number, Node[]>();
		depthMap.set(0, [node]);

		const depthList: number[] = [0];
		const found: Path[] = [];
		const getPath = this.getPath.bind(this);

		const enqueue = (node: Node, depth: number): void => {
			depthMap.has(depth) ? depthMap.get(depth)!.push(node) : depthMap.set(depth, [node]);
			orderedSetInsert(depthList, depth);
		};

		const orderedSetInsert = (arr: number[], val: number): number[] => {
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
		};

		const readNode = (node: Node, curDepth: number): Path | false => {
			const edges = finalDirection === 0 ? node.edges : finalDirection > 0 ? node.outputEdges : node.inputEdges;

			for (let i = 0, len = edges.length; i < len; i++) {
				const edge = edges[i];
				const depth = curDepth + edge.distance;

				if (finalMaxDepth && depth > finalMaxDepth) {
					continue;
				}

				const tnode = edges[i].oppositeNode(node) as Node;

				if (!nodePath[tnode._uniqid_]) {
					nodePath[tnode._uniqid_] = [edge, tnode];
					enqueue(tnode, depth);
				}
			}

			if (curDepth >= finalMinDepth && finalPassCondition(node)) {
				return new Path(getPath(node, nodePath));
			}

			return false;
		};

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

	toMermaid(): string {
		// Start with the graph definition
		let mermaidCode = 'graph TD\n';

		// Process all nodes
		for (const node of this.nodes) {
			// Add node with ID and label (entity name + properties if any)
			const nodeProps =
				Object.keys(node.properties).length > 0
					? ` (${Object.entries(node.properties)
							.map(([key, value]) => {
								return `${key}: ${value}`;
							})
							.join(', ')})`
					: '';

			mermaidCode += `    ${node._uniqid_}["${node.entity}${nodeProps}"]\n`;
		}

		// Process all edges
		for (const edge of this.edges) {
			if (edge.inputNode && edge.outputNode) {
				// Use proper Mermaid syntax for arrows
				const linkStyle = edge.duplex ? ' <--> ' : ' --> ';
				const edgeLabel = edge.entity !== '' ? `|"${edge.entity} (${edge.distance})"|` : '';

				mermaidCode += `    ${edge.inputNode._uniqid_}${linkStyle}${edgeLabel}${edge.outputNode._uniqid_}\n`;
			}
		}

		return mermaidCode;
	}

	toJSON(): any {
		const nodeCollections = this.nodeCollections;
		const nc = Object.keys(nodeCollections).map(entity => {
			return nodeCollections[entity].toJSON();
		});

		const edgeCollections = this.edgeCollections;
		const ec = Object.keys(edgeCollections).map(entity => {
			return edgeCollections[entity].toJSON();
		});

		const nodes = this.nodes.map(node => {
			return node.toJSON();
		});

		const edges = this.edges.map(edge => {
			return edge.toJSON();
		});

		return {
			nodes: nodes,
			edges: edges,
			nodeCollections: nc,
			edgeCollections: ec
		};
	}

	trace(fromNode: Node, toNode: Node, direction?: number): Path {
		const passCondition = (node: Node): boolean => {
			return node === toNode;
		};

		return this.search(fromNode, passCondition, 1, direction)[0] || new Path([]);
	}
}

export default Graph;
