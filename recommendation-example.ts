import { Graph } from './index';
import Node from './node';
import Path from './path';
import RecommendationSystem, { InteractionType } from './recommendation';

// Create a simple example of a recommendation system for an e-commerce platform
function createEcommerceRecommendationExample() {
	// Create a new graph
	const graph = new Graph();

	// Create a recommendation system using the graph
	const recommendationSystem = new RecommendationSystem(graph);

	// Create users
	const alice = graph.createNode('user', { name: 'Alice', id: 'user1' });
	const bob = graph.createNode('user', { name: 'Bob', id: 'user2' });
	const charlie = graph.createNode('user', { name: 'Charlie', id: 'user3' });
	const dave = graph.createNode('user', { name: 'Dave', id: 'user4' });
	const eve = graph.createNode('user', { name: 'Eve', id: 'user5' });

	// Create products
	const laptop = graph.createNode('product', { name: 'Laptop', id: 'prod1', category: 'electronics' });
	const phone = graph.createNode('product', { name: 'Smartphone', id: 'prod2', category: 'electronics' });
	const headphones = graph.createNode('product', { name: 'Headphones', id: 'prod3', category: 'electronics' });
	const book = graph.createNode('product', { name: 'Book', id: 'prod4', category: 'books' });
	const shirt = graph.createNode('product', { name: 'T-Shirt', id: 'prod5', category: 'clothing' });
	const tablet = graph.createNode('product', { name: 'Tablet', id: 'prod6', category: 'electronics' });
	const watch = graph.createNode('product', { name: 'Smartwatch', id: 'prod7', category: 'electronics' });
	const shoes = graph.createNode('product', { name: 'Running Shoes', id: 'prod8', category: 'clothing' });

	// Record interactions between users and products

	// Alice viewed and bought a laptop
	recommendationSystem.recordInteraction(alice, laptop, InteractionType.VIEW);
	recommendationSystem.recordInteraction(alice, laptop, InteractionType.BUY);

	// Alice viewed a phone but didn't buy it
	recommendationSystem.recordInteraction(alice, phone, InteractionType.VIEW);

	// Alice viewed and liked headphones
	recommendationSystem.recordInteraction(alice, headphones, InteractionType.VIEW);
	recommendationSystem.recordInteraction(alice, headphones, InteractionType.LIKE);

	// Bob viewed and bought a phone
	recommendationSystem.recordInteraction(bob, phone, InteractionType.VIEW);
	recommendationSystem.recordInteraction(bob, phone, InteractionType.BUY);

	// Bob viewed a laptop but didn't buy it
	recommendationSystem.recordInteraction(bob, laptop, InteractionType.VIEW);

	// Bob viewed, liked, and bought headphones
	recommendationSystem.recordInteraction(bob, headphones, InteractionType.VIEW);
	recommendationSystem.recordInteraction(bob, headphones, InteractionType.LIKE);
	recommendationSystem.recordInteraction(bob, headphones, InteractionType.BUY);

	// Bob viewed and bought a tablet
	recommendationSystem.recordInteraction(bob, tablet, InteractionType.VIEW);
	recommendationSystem.recordInteraction(bob, tablet, InteractionType.BUY);

	// Charlie viewed and bought a book
	recommendationSystem.recordInteraction(charlie, book, InteractionType.VIEW);
	recommendationSystem.recordInteraction(charlie, book, InteractionType.BUY);

	// Charlie viewed a laptop and phone
	recommendationSystem.recordInteraction(charlie, laptop, InteractionType.VIEW);
	recommendationSystem.recordInteraction(charlie, phone, InteractionType.VIEW);

	// Charlie viewed and bought a watch
	recommendationSystem.recordInteraction(charlie, watch, InteractionType.VIEW);
	recommendationSystem.recordInteraction(charlie, watch, InteractionType.BUY);

	// Dave viewed and bought a shirt
	recommendationSystem.recordInteraction(dave, shirt, InteractionType.VIEW);
	recommendationSystem.recordInteraction(dave, shirt, InteractionType.BUY);

	// Dave viewed headphones
	recommendationSystem.recordInteraction(dave, headphones, InteractionType.VIEW);

	// Dave viewed and bought shoes
	recommendationSystem.recordInteraction(dave, shoes, InteractionType.VIEW);
	recommendationSystem.recordInteraction(dave, shoes, InteractionType.BUY);

	// Eve viewed and bought headphones and a book
	recommendationSystem.recordInteraction(eve, headphones, InteractionType.VIEW);
	recommendationSystem.recordInteraction(eve, headphones, InteractionType.BUY);
	recommendationSystem.recordInteraction(eve, book, InteractionType.VIEW);
	recommendationSystem.recordInteraction(eve, book, InteractionType.BUY);

	// Eve viewed and liked a tablet
	recommendationSystem.recordInteraction(eve, tablet, InteractionType.VIEW);
	recommendationSystem.recordInteraction(eve, tablet, InteractionType.LIKE);

	return {
		graph,
		recommendationSystem,
		users: { alice, bob, charlie, dave, eve },
		products: { laptop, phone, headphones, book, shirt, tablet, watch, shoes }
	};
}

// Example usage
function runRecommendationExamples() {
	const { recommendationSystem, users, products, graph } = createEcommerceRecommendationExample();
	const { alice, bob } = users;
	const { laptop, phone, headphones } = products;

	console.log('=== Recommendation Examples ===');

	// Debug: Print graph statistics
	console.log(`\nGraph Statistics:`);
	console.log(`- Nodes: ${graph.getNodeCount()}`);
	console.log(`- Edges: ${graph.getEdgeCount()}`);

	// Debug: Print Alice's connections
	console.log(`\nAlice's connections:`);
	console.log(`- Output edges: ${alice.outputEdges.length}`);
	console.log(`- Input edges: ${alice.inputEdges.length}`);
	alice.outputEdges.forEach(edge => {
		console.log(`  - ${edge.entity} -> ${edge.outputNode?.get('name')} (distance: ${edge.distance})`);
	});

	// Example 1: Get all recommendations for Alice
	console.log('\n1. All recommendations for Alice:');
	const allRecommendations = graph.closest(alice, {
		algorithm: 'hybrid',
		compare: node => node._uniqid_ !== alice._uniqid_ && node.entity === 'product',
		count: 5,
		direction: 1,
		minDepth: 1,
		maxDepth: 3
	});
	console.log(`Found ${allRecommendations.length} recommendations`);
	allRecommendations.forEach(path => {
		const endNode = path.end();
		if (endNode instanceof Node) {
			console.log(`- ${endNode.get('name')} (distance: ${path.distance()})`);
		}
	});

	// Example 2: Get recommendations for Alice based only on BUY interactions
	console.log('\n2. Recommendations for Alice based on BUY interactions:');
	const buyRecommendations = recommendationSystem.getRecommendations(alice, {
		interactionTypes: [InteractionType.BUY],
		maxDepth: 3
	});
	console.log(`Found ${buyRecommendations.length} recommendations`);
	buyRecommendations.forEach(path => {
		const endNode = path.end();
		if (endNode instanceof Node) {
			console.log(`- ${endNode.get('name')} (distance: ${path.distance()})`);
		}
	});

	// Example 3: Get recommendations for Alice based only on VIEW interactions
	console.log('\n3. Recommendations for Alice based on VIEW interactions:');
	const viewRecommendations = recommendationSystem.getRecommendations(alice, {
		interactionTypes: [InteractionType.VIEW],
		maxDepth: 3
	});
	console.log(`Found ${viewRecommendations.length} recommendations`);
	viewRecommendations.forEach(path => {
		const endNode = path.end();
		if (endNode instanceof Node) {
			console.log(`- ${endNode.get('name')} (distance: ${path.distance()})`);
		}
	});

	// Example 4: "Users who viewed this also bought" for laptop
	console.log('\n4. Users who viewed laptop also bought:');
	const viewedAlsoBought = recommendationSystem.getInteractionBasedRecommendations(laptop, InteractionType.VIEW, InteractionType.BUY);
	console.log(`Found ${viewedAlsoBought.length} recommendations`);
	viewedAlsoBought.forEach(path => {
		const endNode = path.end();
		if (endNode instanceof Node) {
			console.log(`- ${endNode.get('name')}`);
		}
	});

	// Example 5: "Users who bought this also bought" for headphones
	console.log('\n5. Users who bought headphones also bought:');
	const boughtAlsoBought = recommendationSystem.getInteractionBasedRecommendations(headphones, InteractionType.BUY, InteractionType.BUY);
	console.log(`Found ${boughtAlsoBought.length} recommendations`);
	boughtAlsoBought.forEach(path => {
		const endNode = path.end();
		if (endNode instanceof Node) {
			console.log(`- ${endNode.get('name')}`);
		}
	});

	// Example 6: Filter recommendations by category
	console.log('\n6. Electronics recommendations for Bob:');
	const electronicsRecommendations = recommendationSystem.getRecommendations(bob, {
		nodeFilter: node => node.entity === 'product' && node.get('category') === 'electronics'
	});
	console.log(`Found ${electronicsRecommendations.length} recommendations`);
	electronicsRecommendations.forEach(path => {
		const endNode = path.end();
		if (endNode instanceof Node) {
			console.log(`- ${endNode.get('name')} (${endNode.get('category')})`);
		}
	});

	// Example 7: Hybrid recommendations (users who viewed phone and bought headphones)
	console.log('\n7. Users who viewed phone and bought headphones also bought:');

	// First, find users who viewed phone
	const usersViewedPhone = new Set<Node>();
	phone.inputEdges.forEach(edge => {
		if (edge.entity === InteractionType.VIEW && edge.inputNode) {
			usersViewedPhone.add(edge.inputNode);
		}
	});

	// Then, filter to users who also bought headphones
	const usersViewedPhoneBoughtHeadphones = new Set<Node>();
	headphones.inputEdges.forEach(edge => {
		if (edge.entity === InteractionType.BUY && edge.inputNode && usersViewedPhone.has(edge.inputNode)) {
			usersViewedPhoneBoughtHeadphones.add(edge.inputNode);
		}
	});

	// Find what else these users bought
	const hybridRecommendations = new Map<string, { node: Node; score: number }>();

	usersViewedPhoneBoughtHeadphones.forEach(user => {
		user.outputEdges.forEach(edge => {
			if (
				edge.entity === InteractionType.BUY &&
				edge.outputNode &&
				edge.outputNode._uniqid_ !== phone._uniqid_ &&
				edge.outputNode._uniqid_ !== headphones._uniqid_
			) {
				const product = edge.outputNode;
				const productId = product._uniqid_;

				if (!hybridRecommendations.has(productId)) {
					hybridRecommendations.set(productId, { node: product, score: 1 });
				} else {
					const current = hybridRecommendations.get(productId)!;
					hybridRecommendations.set(productId, { node: product, score: current.score + 1 });
				}
			}
		});
	});

	// Convert to paths and sort by score
	const hybridResults = Array.from(hybridRecommendations.values())
		.sort((a, b) => b.score - a.score)
		.map(item => new Path([item.node]));

	console.log(`Found ${hybridResults.length} recommendations`);
	hybridResults.forEach(path => {
		const endNode = path.end();
		if (endNode instanceof Node) {
			console.log(`- ${endNode.get('name')}`);
		}
	});
}

// Run the examples
runRecommendationExamples();

// Export for testing or further use
export { createEcommerceRecommendationExample };
