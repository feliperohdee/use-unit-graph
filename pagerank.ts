import Graph from './graph';
import Node from './node';
import Edge from './edge';

type PageRankOptions = {
	dampingFactor?: number;
	maxIterations?: number;
	tolerance?: number;
};

/**
 * PageRank algorithm implementation for graph analysis.
 *
 * The PageRank algorithm assigns a numerical weight to each node in a graph,
 * measuring its relative importance within the graph based on its connections.
 */
class PageRank {
	private graph: Graph;
	private dampingFactor: number;
	private maxIterations: number;
	private tolerance: number;
	private scores: Map<string, number> = new Map();

	/**
	 * Creates a new PageRank instance.
	 *
	 * @param graph - The graph to analyze
	 * @param options - Configuration options
	 */
	constructor(graph: Graph, options: PageRankOptions = {}) {
		this.graph = graph;
		this.dampingFactor = options.dampingFactor ?? 0.85;
		this.maxIterations = options.maxIterations ?? 100;
		this.tolerance = options.tolerance ?? 1e-6;
	}

	/**
	 * Computes PageRank scores for all nodes in the graph.
	 *
	 * @returns A Map of node IDs to their PageRank scores
	 */
	compute(): Map<string, number> {
		// Get all nodes from the graph
		const nodes: Node[] = this.getAllNodesFromGraph();

		if (nodes.length === 0) {
			return new Map();
		}

		// Initialize scores evenly
		const initialScore = 1.0 / nodes.length;
		nodes.forEach((node: Node) => {
			this.scores.set(node._uniqid_, initialScore);
		});

		let iteration = 0;
		let converged = false;

		while (iteration < this.maxIterations && !converged) {
			const newScores = new Map<string, number>();
			let maxDifference = 0;

			// Calculate new scores
			nodes.forEach((node: Node) => {
				const incomingNodes = this.getIncomingNodes(node);
				let sum = 0;

				incomingNodes.forEach((inNode: Node) => {
					const outgoingCount = this.getOutgoingCount(inNode);
					if (outgoingCount > 0) {
						const inNodeScore = this.scores.get(inNode._uniqid_) || 0;
						sum += inNodeScore / outgoingCount;
					}
				});

				// PageRank formula: (1-d)/N + d * sum(PR(i)/C(i))
				const randomJumpProbability = (1 - this.dampingFactor) / nodes.length;
				const newScore = randomJumpProbability + this.dampingFactor * sum;

				newScores.set(node._uniqid_, newScore);

				// Track convergence
				const oldScore = this.scores.get(node._uniqid_) || 0;
				const difference = Math.abs(newScore - oldScore);
				maxDifference = Math.max(maxDifference, difference);
			});

			// Update scores
			this.scores = newScores;

			// Check for convergence
			converged = maxDifference < this.tolerance;
			iteration++;
		}

		return this.scores;
	}

	/**
	 * Gets the PageRank score for a specific node.
	 *
	 * @param node - The node to get the score for
	 * @returns The PageRank score or 0 if not computed
	 */
	getScore(node: Node): number {
		return this.scores.get(node._uniqid_) || 0;
	}

	/**
	 * Gets the top N nodes by PageRank score.
	 *
	 * @param n - Number of top nodes to return
	 * @returns Array of nodes sorted by PageRank score (highest first)
	 */
	getTopNodes(n: number = 10): Node[] {
		if (this.scores.size === 0) {
			this.compute();
		}

		const nodes: Node[] = this.getAllNodesFromGraph();

		return nodes
			.sort((a: Node, b: Node) => {
				const scoreA = this.scores.get(a._uniqid_) || 0;
				const scoreB = this.scores.get(b._uniqid_) || 0;
				return scoreB - scoreA; // Descending order
			})
			.slice(0, n);
	}

	/**
	 * Gets relevant nodes from a source node based on PageRank scores and connectivity.
	 * This method is designed to be used with graph.closest() for finding important related nodes.
	 *
	 * @param sourceNode - The source node to find relevant nodes from
	 * @param options - Options for finding relevant nodes
	 * @param options.minDepth - Minimum distance (hops) from source node (default: 1)
	 * @param options.maxDepth - Maximum distance (hops) from source node (default: 2)
	 * @param options.limit - Maximum number of nodes to return (default: 10)
	 * @param options.minScore - Minimum PageRank score threshold (default: 0)
	 * @returns Array of relevant nodes sorted by PageRank score
	 */
	getRelevantNodes(
		sourceNode: Node,
		options: {
			limit?: number;
			maxDepth?: number;
			minDepth?: number;
			minScore?: number;
		} = {}
	): Node[] {
		const minDepth = options.minDepth ?? 1;
		const maxDepth = options.maxDepth ?? 2;
		const limit = options.limit ?? 10;
		const minScore = options.minScore ?? 0;

		// Ensure scores are computed
		if (this.scores.size === 0) {
			this.compute();
		}

		// Get nodes within distance range from sourceNode
		const nodesWithDistances = this.getNodesWithDistances(sourceNode, maxDepth);

		// Filter by min/max depth and exclude the source node
		const relevantNodes = nodesWithDistances
			.filter(({ node, distance }) => {
				return node._uniqid_ !== sourceNode._uniqid_ && distance >= minDepth && distance <= maxDepth;
			})
			.map(({ node }) => node);

		// Sort by PageRank score and filter by minimum score
		return relevantNodes
			.filter(node => {
				const score = this.scores.get(node._uniqid_) || 0;
				return score >= minScore;
			})
			.sort((a, b) => {
				const scoreA = this.scores.get(a._uniqid_) || 0;
				const scoreB = this.scores.get(b._uniqid_) || 0;
				return scoreB - scoreA; // Descending order
			})
			.slice(0, limit);
	}

	/**
	 * Gets all nodes with their distances from a source node.
	 *
	 * @param sourceNode - The source node
	 * @param maxDepth - Maximum distance (hops) from source node
	 * @returns Array of objects containing nodes and their distances
	 */
	private getNodesWithDistances(sourceNode: Node, maxDepth: number): Array<{ node: Node; distance: number }> {
		const visited = new Set<string>([sourceNode._uniqid_]);
		const result: Array<{ node: Node; distance: number }> = [{ node: sourceNode, distance: 0 }];
		let currentLevel: Node[] = [sourceNode];
		let currentDistance = 0;

		// Breadth-first search up to maxDepth
		while (currentDistance < maxDepth && currentLevel.length > 0) {
			currentDistance++;
			const nextLevel: Node[] = [];

			for (const node of currentLevel) {
				// Get both incoming and outgoing connections
				const connectedNodes = this.getConnectedNodes(node);

				for (const connectedNode of connectedNodes) {
					if (!visited.has(connectedNode._uniqid_)) {
						visited.add(connectedNode._uniqid_);
						result.push({ node: connectedNode, distance: currentDistance });
						nextLevel.push(connectedNode);
					}
				}
			}

			currentLevel = nextLevel;
		}

		return result;
	}

	/**
	 * Gets all nodes directly connected to a node (both incoming and outgoing).
	 *
	 * @param node - The node to get connections for
	 * @returns Array of connected nodes
	 */
	private getConnectedNodes(node: Node): Node[] {
		const connectedNodes: Node[] = [];
		const nodeIds = new Set<string>();

		// Add outgoing connections
		node.outputEdges.forEach((edge: Edge) => {
			const targetNode = edge.outputNode;
			if (targetNode && !nodeIds.has(targetNode._uniqid_)) {
				nodeIds.add(targetNode._uniqid_);
				connectedNodes.push(targetNode);
			}
		});

		// Add incoming connections
		node.inputEdges.forEach((edge: Edge) => {
			const sourceNode = edge.inputNode;
			if (sourceNode && !nodeIds.has(sourceNode._uniqid_)) {
				nodeIds.add(sourceNode._uniqid_);
				connectedNodes.push(sourceNode);
			}
		});

		return connectedNodes;
	}

	/**
	 * Gets all nodes from the graph by collecting them from all entity types.
	 *
	 * @returns Array of all nodes in the graph
	 */
	private getAllNodesFromGraph(): Node[] {
		// Since there's no direct getAllNodes method, we need to get the node count
		// and access the nodes array directly or collect them from node collections
		return this.graph['nodes'] as Node[];
	}

	/**
	 * Gets all nodes that have edges pointing to the given node.
	 *
	 * @param node - The target node
	 * @returns Array of nodes with edges to the target
	 */
	private getIncomingNodes(node: Node): Node[] {
		// Get nodes that have edges pointing to this node
		const incomingNodes: Node[] = [];

		// Use the inputEdges property of the Node class
		const inputEdges = node.inputEdges;

		inputEdges.forEach((edge: Edge) => {
			// The source node of an input edge is the incoming node
			// Based on the Edge class, we should use inputNode property
			const sourceNode = edge.inputNode;
			if (sourceNode) {
				incomingNodes.push(sourceNode);
			}
		});

		return incomingNodes;
	}

	/**
	 * Gets the count of outgoing edges from a node.
	 *
	 * @param node - The source node
	 * @returns Number of outgoing edges
	 */
	private getOutgoingCount(node: Node): number {
		return node.outputEdges.length;
	}
}

export default PageRank;
export { PageRankOptions };
