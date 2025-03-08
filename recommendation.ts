import { Graph } from './index';
import Node from './node';
import Edge from './edge';
import Path from './path';
import PageRank from './pagerank';

// Define interaction types and their default distances
export enum InteractionType {
	VIEW = 'view',
	BUY = 'buy',
	LIKE = 'like',
	SHARE = 'share',
	COMMENT = 'comment'
}

// Default distances for each interaction type (lower = stronger connection)
export const DEFAULT_DISTANCES = {
	[InteractionType.BUY]: 1, // Strongest connection
	[InteractionType.LIKE]: 2,
	[InteractionType.COMMENT]: 3,
	[InteractionType.SHARE]: 4,
	[InteractionType.VIEW]: 5 // Weakest connection
};

export type RecommendationOptions = {
	// Interaction types to consider (if empty, all types are considered)
	interactionTypes?: InteractionType[];
	// Maximum number of recommendations to return
	count?: number;
	// Direction of recommendation (0: both, 1: outgoing, -1: incoming)
	direction?: number;
	// Minimum depth for recommendations
	minDepth?: number;
	// Maximum depth for recommendations
	maxDepth?: number;
	// Additional filter for nodes
	nodeFilter?: (node: Node) => boolean;
};

export class RecommendationSystem {
	private graph: Graph;

	constructor(graph?: Graph) {
		this.graph = graph || new Graph();
	}

	/**
	 * Record an interaction between a user and an item
	 */
	recordInteraction(
		user: Node,
		item: Node,
		interactionType: InteractionType,
		properties: { [key: string]: any } = {},
		bidirectional: boolean = false
	) {
		const distance = properties.distance || DEFAULT_DISTANCES[interactionType] || 1;

		// Create an edge with the interaction type as the entity
		const edge = this.graph.createEdge(interactionType, properties);

		// Link the user to the item with the specified distance
		edge.link(user, item, bidirectional).setDistance(distance);

		return edge;
	}

	/**
	 * Get recommendations for a user based on specified interaction types
	 */
	getRecommendations(user: Node, options: RecommendationOptions = {}): Path[] {
		const { interactionTypes = [], count = 10, direction = 1, minDepth = 1, maxDepth = 3, nodeFilter } = options;

		// For all interactions, we can use the standard closest function
		// but we need to filter out the user node itself
		const baseCompare = (node: Node): boolean => {
			// Skip the starting node
			if (node._uniqid_ === user._uniqid_) {
				return false;
			}

			// Apply node filter if provided
			if (nodeFilter && !nodeFilter(node)) {
				return false;
			}

			return true;
		};

		// If no specific interaction types are specified, use the graph's closest method
		if (interactionTypes.length === 0) {
			return this.graph.closest(user, {
				algorithm: 'hybrid',
				compare: baseCompare,
				count,
				direction,
				minDepth,
				maxDepth
			});
		}

		// For specific interaction types, we'll use a collaborative filtering approach
		// 1. Find all products the user has interacted with using the specified interaction types
		const userProducts = new Set<Node>();

		user.outputEdges.forEach(edge => {
			if (interactionTypes.includes(edge.entity as InteractionType) && edge.outputNode) {
				userProducts.add(edge.outputNode);
			}
		});

		if (direction <= 0) {
			user.inputEdges.forEach(edge => {
				if (interactionTypes.includes(edge.entity as InteractionType) && edge.inputNode) {
					userProducts.add(edge.inputNode);
				}
			});
		}

		// 2. Find users who interacted with the same products using the same interaction types
		const similarUsers = new Map<string, { user: Node; similarity: number }>();

		userProducts.forEach(product => {
			// Check users who have interacted with this product
			const productUsers = new Set<Node>();

			// Check incoming edges (users who acted on the product)
			product.inputEdges.forEach(edge => {
				if (interactionTypes.includes(edge.entity as InteractionType) && edge.inputNode && edge.inputNode._uniqid_ !== user._uniqid_) {
					productUsers.add(edge.inputNode);
				}
			});

			// If bidirectional, also check outgoing edges
			if (direction <= 0) {
				product.outputEdges.forEach(edge => {
					if (interactionTypes.includes(edge.entity as InteractionType) && edge.outputNode && edge.outputNode._uniqid_ !== user._uniqid_) {
						productUsers.add(edge.outputNode);
					}
				});
			}

			// Increase similarity score for each user who interacted with the same product
			productUsers.forEach(similarUser => {
				const userId = similarUser._uniqid_;

				if (!similarUsers.has(userId)) {
					similarUsers.set(userId, { user: similarUser, similarity: 1 });
				} else {
					const current = similarUsers.get(userId)!;
					similarUsers.set(userId, {
						user: similarUser,
						similarity: current.similarity + 1
					});
				}
			});
		});

		// 3. Find products that similar users have interacted with, but the current user hasn't
		const recommendations = new Map<string, { node: Node; score: number }>();

		// Sort similar users by similarity score
		const sortedSimilarUsers = Array.from(similarUsers.values()).sort((a, b) => b.similarity - a.similarity);

		// Get recommendations from each similar user, weighted by similarity
		sortedSimilarUsers.forEach(({ user: similarUser, similarity }) => {
			// Check outgoing edges (products the user has acted on)
			similarUser.outputEdges.forEach(edge => {
				if (interactionTypes.includes(edge.entity as InteractionType) && edge.outputNode && !userProducts.has(edge.outputNode)) {
					const product = edge.outputNode;

					// Apply node filter if provided
					if (nodeFilter && !nodeFilter(product)) {
						return;
					}

					const productId = product._uniqid_;
					const weight = similarity * (1 / edge.distance); // Weight by similarity and edge strength

					if (!recommendations.has(productId)) {
						recommendations.set(productId, { node: product, score: weight });
					} else {
						const current = recommendations.get(productId)!;
						recommendations.set(productId, {
							node: product,
							score: current.score + weight
						});
					}
				}
			});

			// If bidirectional, also check incoming edges
			if (direction <= 0) {
				similarUser.inputEdges.forEach(edge => {
					if (interactionTypes.includes(edge.entity as InteractionType) && edge.inputNode && !userProducts.has(edge.inputNode)) {
						const product = edge.inputNode;

						// Apply node filter if provided
						if (nodeFilter && !nodeFilter(product)) {
							return;
						}

						const productId = product._uniqid_;
						const weight = similarity * (1 / edge.distance); // Weight by similarity and edge strength

						if (!recommendations.has(productId)) {
							recommendations.set(productId, { node: product, score: weight });
						} else {
							const current = recommendations.get(productId)!;
							recommendations.set(productId, {
								node: product,
								score: current.score + weight
							});
						}
					}
				});
			}
		});

		// 4. Convert to paths and sort by score
		const result = Array.from(recommendations.values())
			.sort((a, b) => b.score - a.score)
			.slice(0, count)
			.map(item => new Path([item.node]));

		return result;
	}

	/**
	 * Get recommendations based on specific interaction patterns
	 * For example: "Users who viewed X also bought Y"
	 */
	getInteractionBasedRecommendations(
		item: Node,
		sourceInteraction: InteractionType,
		targetInteraction: InteractionType,
		options: Omit<RecommendationOptions, 'interactionTypes'> = {}
	): Path[] {
		const {
			count = 10,
			direction = -1, // Default to incoming for "users who..."
			minDepth = 1,
			maxDepth = 3,
			nodeFilter
		} = options;

		// Find users who had the source interaction with this item
		const usersWithSourceInteraction = new Set<Node>();

		// Check incoming edges to the item
		item.inputEdges.forEach(edge => {
			if (edge.entity === sourceInteraction && edge.inputNode) {
				usersWithSourceInteraction.add(edge.inputNode);
			}
		});

		// If bidirectional, also check outgoing edges
		if (direction !== -1) {
			item.outputEdges.forEach(edge => {
				if (edge.entity === sourceInteraction && edge.outputNode) {
					usersWithSourceInteraction.add(edge.outputNode);
				}
			});
		}

		// For each user, find items they had the target interaction with
		const recommendations = new Map<string, { node: Node; score: number }>();

		usersWithSourceInteraction.forEach(user => {
			// Find items this user had the target interaction with
			user.outputEdges.forEach(edge => {
				if (edge.entity === targetInteraction && edge.outputNode) {
					const targetItem = edge.outputNode;

					// Skip the original item
					if (targetItem._uniqid_ === item._uniqid_) {
						return;
					}

					// Apply node filter if provided
					if (nodeFilter && !nodeFilter(targetItem)) {
						return;
					}

					const itemId = targetItem._uniqid_;

					if (!recommendations.has(itemId)) {
						recommendations.set(itemId, { node: targetItem, score: 1 });
					} else {
						const current = recommendations.get(itemId)!;
						recommendations.set(itemId, { node: targetItem, score: current.score + 1 });
					}
				}
			});

			// If bidirectional, also check incoming edges
			if (direction !== 1) {
				user.inputEdges.forEach(edge => {
					if (edge.entity === targetInteraction && edge.inputNode) {
						const targetItem = edge.inputNode;

						// Skip the original item
						if (targetItem._uniqid_ === item._uniqid_) {
							return;
						}

						// Apply node filter if provided
						if (nodeFilter && !nodeFilter(targetItem)) {
							return;
						}

						const itemId = targetItem._uniqid_;

						if (!recommendations.has(itemId)) {
							recommendations.set(itemId, { node: targetItem, score: 1 });
						} else {
							const current = recommendations.get(itemId)!;
							recommendations.set(itemId, { node: targetItem, score: current.score + 1 });
						}
					}
				});
			}
		});

		// Convert to paths and sort by score
		const result = Array.from(recommendations.values())
			.sort((a, b) => b.score - a.score)
			.slice(0, count)
			.map(item => new Path([item.node]));

		return result;
	}

	/**
	 * Get recommendations using PageRank algorithm
	 * This method identifies influential products in the network and recommends them
	 * based on their PageRank score and relevance to the user
	 */
	getPageRankRecommendations(user: Node, options: RecommendationOptions = {}): Path[] {
		const { interactionTypes = [], count = 10, direction = 1, minDepth = 1, maxDepth = 3, nodeFilter } = options;

		// Create a PageRank instance for the graph
		const pageRank = new PageRank(this.graph);

		// Compute PageRank scores for all nodes
		pageRank.compute();

		// Define a compare function that filters by node type and user's interactions
		const compareFunction = (node: Node): boolean => {
			// Skip the user node itself
			if (node._uniqid_ === user._uniqid_) {
				return false;
			}

			// Apply node filter if provided
			if (nodeFilter && !nodeFilter(node)) {
				return false;
			}

			// If specific interaction types are specified, check if the node
			// is connected to the user through those interaction types
			if (interactionTypes.length > 0) {
				// Check if the user has directly interacted with this node
				const hasDirectInteraction = user.outputEdges.some(
					edge => interactionTypes.includes(edge.entity as InteractionType) && edge.outputNode?._uniqid_ === node._uniqid_
				);

				// If there's a direct interaction, skip this node (already known to user)
				if (hasDirectInteraction) {
					return false;
				}

				// For indirect recommendations, we'll rely on PageRank's relevance calculation
			}

			return true;
		};

		// Get relevant nodes using PageRank
		const relevantNodes = pageRank.getRelevantNodes(user, {
			compare: compareFunction,
			limit: count,
			maxDepth,
			minDepth,
			direction,
			minScore: 0.01 // Minimum PageRank score to consider
		});

		// Convert to Path objects
		return relevantNodes.map(node => new Path([node]));
	}

	/**
	 * Get hybrid recommendations that combine collaborative filtering with PageRank
	 * This method balances popularity (PageRank) with personalization (collaborative filtering)
	 */
	getHybridPageRankRecommendations(user: Node, options: RecommendationOptions = {}): Path[] {
		const { interactionTypes = [], count = 10, direction = 1, minDepth = 1, maxDepth = 3, nodeFilter } = options;

		// Get collaborative filtering recommendations
		const collaborativeRecs = this.getRecommendations(user, {
			interactionTypes,
			count: count * 2, // Get more recommendations to blend
			direction,
			minDepth,
			maxDepth,
			nodeFilter
		});

		// Get PageRank recommendations
		const pageRankRecs = this.getPageRankRecommendations(user, {
			interactionTypes,
			count: count * 2, // Get more recommendations to blend
			direction,
			minDepth,
			maxDepth,
			nodeFilter
		});

		// Create a PageRank instance for score lookup
		const pageRank = new PageRank(this.graph);
		pageRank.compute();

		// Combine and score recommendations
		const combinedRecommendations = new Map<string, { node: Node; score: number }>();

		// Process collaborative filtering recommendations
		collaborativeRecs.forEach((path, index) => {
			const node = path.end();
			if (!(node instanceof Node)) return;

			const nodeId = node._uniqid_;
			const collaborativeScore = 1 - index / collaborativeRecs.length; // Normalize to 0-1
			const pageRankScore = pageRank.getScore(node);

			// Weighted score: 70% collaborative, 30% PageRank
			const hybridScore = 0.7 * collaborativeScore + 0.3 * pageRankScore;

			combinedRecommendations.set(nodeId, { node, score: hybridScore });
		});

		// Process PageRank recommendations
		pageRankRecs.forEach((path, index) => {
			const node = path.end();
			if (!(node instanceof Node)) return;

			const nodeId = node._uniqid_;
			const pageRankScore = pageRank.getScore(node);

			if (combinedRecommendations.has(nodeId)) {
				// Node already exists from collaborative filtering, boost its score
				const existing = combinedRecommendations.get(nodeId)!;
				const boostedScore = existing.score * 1.2; // Boost by 20%
				combinedRecommendations.set(nodeId, { node, score: boostedScore });
			} else {
				// New node from PageRank
				const normalizedRankScore = 1 - index / pageRankRecs.length; // Normalize to 0-1
				// Weighted score: 30% normalized rank, 70% actual PageRank
				const hybridScore = 0.3 * normalizedRankScore + 0.7 * pageRankScore;
				combinedRecommendations.set(nodeId, { node, score: hybridScore });
			}
		});

		// Sort by score and convert to paths
		return Array.from(combinedRecommendations.values())
			.sort((a, b) => b.score - a.score)
			.slice(0, count)
			.map(item => new Path([item.node]));
	}

	/**
	 * Get the underlying graph
	 */
	getGraph(): Graph {
		return this.graph;
	}
}

export default RecommendationSystem;
