# use-unit-graph

A lightweight, flexible graph data structure library with comprehensive TypeScript support.

## Features

- **Flexible Data Model**: Create nodes and edges with custom properties
- **Powerful Querying**: Search nodes and edges by indexed properties
- **Path Finding**: Find shortest paths between nodes with configurable algorithms
- **Collection Management**: Group nodes and edges with efficient indexing
- **Serialization**: Save and load graphs in compressed format
- **TypeScript Support**: Fully typed API for better development experience
- **PageRank Algorithm**: Find most influential nodes in your graph using the PageRank algorithm

## Installation

```bash
npm install use-unit-graph
# or
yarn add use-unit-graph
```

## Quick Start

```typescript
import { Graph } from 'use-unit-graph';

// Create a new graph
const graph = new Graph();

// Create some nodes
const alice = graph.createNode('person', { name: 'Alice', age: 30 });
const bob = graph.createNode('person', { name: 'Bob', age: 25 });
const charlie = graph.createNode('person', { name: 'Charlie', age: 35 });

// Create edges to connect the nodes
graph.createEdge('knows').link(alice, bob).setDistance(1);
graph.createEdge('knows').link(bob, charlie).setDistance(2);

// Find a path between nodes
const path = graph.trace(alice, charlie);
console.log(path.prettify());
// Output: Alice >> knows >> Bob >> knows >> Charlie

// Find all nodes connected to Alice, ordered by distance
const connections = graph.closest(alice);
connections.forEach(path => {
	console.log(`${path.end().get('name')} - distance: ${path.distance()}`);
});
```

## API Documentation

### Graph

The main class for creating and managing a graph.

```typescript
const graph = new Graph();
```

#### Creating Nodes and Edges

```typescript
// Create a node with an entity type and properties
const node = graph.createNode('person', { name: 'Alice', age: 30 });

// Create an edge with an entity type and optional properties
const edge = graph.createEdge('knows', { since: 2020 });

// Link two nodes with an edge (directed)
edge.link(nodeA, nodeB);

// Create a bidirectional edge
edge.link(nodeA, nodeB, true);
```

#### Finding Paths

```typescript
// Find a path between two nodes
const path = graph.trace(nodeA, nodeB);

// Find paths with direction constraints
// 1: only outgoing edges, -1: only incoming edges, 0: both (default)
const path = graph.trace(nodeA, nodeB, 1);

// Find all reachable nodes from a starting node, ordered by distance
const paths = graph.closest(nodeA);

// With options
const paths = graph.closest(nodeA, {
	direction: 1, // Direction constraint
	count: 5, // Limit number of results
	minDepth: 1, // Minimum distance
	maxDepth: 3, // Maximum distance
	compare: node => node.get('age') > 25 // Filter nodes
});

// Find nodes using PageRank algorithm
const paths = graph.closest(nodeA, {
	algorithm: 'pagerank', // Use PageRank for node ranking
	count: 5, // Limit number of results
	direction: 0, // Direction constraint (0 for both directions)
	minDepth: 1, // Minimum distance
	maxDepth: 3 // Maximum distance
});
```

#### Querying Nodes and Edges

```typescript
// Create an index on a property for faster lookups
graph.getNodes('person').createIndex('name');

// Find a node by indexed property
const alice = graph.getNodes('person').find('name', 'Alice');

// Query nodes with filters
const youngPeople = graph.getNodes('person').query().filter({ age__lt: 30 }).units();
```

#### Serialization

```typescript
// Save graph to a file (Promise-based)
await graph.save('mygraph.gz');

// Load graph from a file
await graph.load('mygraph.gz');

// Convert to JSON
const json = graph.toJSON();

// Create from JSON
const newGraph = new Graph().fromJSON(json);
```

### Nodes and Edges

Nodes and edges have methods for accessing and modifying their properties.

```typescript
// Get a property value
const name = node.get('name');

// Set a property value
node.set('name', 'New Name');

// Check if a property exists
if (node.has('age')) {
	// Do something
}

// Remove a property
node.unset('temporary_property');

// Get all connected edges for a node
const allEdges = node.edges;

// Get only incoming or outgoing edges
const incomingEdges = node.inputEdges;
const outgoingEdges = node.outputEdges;

// Set edge distance (for path finding)
edge.setDistance(2.5);

// Set edge weight (inverse of distance)
edge.setWeight(0.5); // Sets distance to 2.0
```

## Examples

### Social Network

```typescript
const graph = new Graph();

// Create users
const users = [
	graph.createNode('user', { name: 'Alice', age: 28 }),
	graph.createNode('user', { name: 'Bob', age: 32 }),
	graph.createNode('user', { name: 'Charlie', age: 25 })
];

// Create friendship connections
graph.createEdge('friends').link(users[0], users[1], true);
graph.createEdge('friends').link(users[1], users[2], true);

// Find friends of friends
const aliceFriends = users[0].outputEdges.map(e => e.outputNode);
const friendsOfFriends = [];

aliceFriends.forEach(friend => {
	friend.outputEdges.forEach(e => {
		if (e.outputNode !== users[0]) {
			friendsOfFriends.push(e.outputNode);
		}
	});
});
```

### Knowledge Graph

```typescript
const graph = new Graph();

// Index nodes by name for easy lookup
graph.getNodes('concept').createIndex('name');

// Create concepts
const math = graph.createNode('concept', { name: 'Mathematics' });
const algebra = graph.createNode('concept', { name: 'Algebra' });
const calculus = graph.createNode('concept', { name: 'Calculus' });

// Create relationships
graph.createEdge('includes').link(math, algebra);
graph.createEdge('includes').link(math, calculus);
graph.createEdge('prerequisite').link(calculus, algebra);

// Find prerequisites for calculus
const prerequisites = calculus.inputEdges.filter(e => e.entity === 'prerequisite').map(e => e.inputNode);
```

## Advanced Usage

### Path Finding Algorithms

```typescript
// Use the hybrid search algorithm for complex path finding
const paths = graph.closest(startNode, {
	algorithm: 'hybrid' // Default algorithm
	// other options...
});

// Use PageRank algorithm to find most influential nodes
const paths = graph.closest(startNode, {
	algorithm: 'pagerank'
	// other options...
});
```

### Recommendation System

The library includes a recommendation system that can be used to build recommendation engines based on user interactions with items.

```typescript
import { Graph, RecommendationSystem, InteractionType } from 'use-unit-graph';

// Create a new graph
const graph = new Graph();

// Create a recommendation system
const recommendationSystem = new RecommendationSystem(graph);

// Create users and products
const alice = graph.createNode('user', { name: 'Alice' });
const bob = graph.createNode('user', { name: 'Bob' });
const laptop = graph.createNode('product', { name: 'Laptop' });
const phone = graph.createNode('product', { name: 'Phone' });

// Record interactions between users and products
recommendationSystem.recordInteraction(alice, laptop, InteractionType.VIEW);
recommendationSystem.recordInteraction(alice, laptop, InteractionType.BUY);
recommendationSystem.recordInteraction(bob, laptop, InteractionType.VIEW);
recommendationSystem.recordInteraction(bob, phone, InteractionType.BUY);

// Get recommendations for Alice
const recommendations = recommendationSystem.getRecommendations(alice);

// Get recommendations for Alice based only on BUY interactions
const buyRecommendations = recommendationSystem.getRecommendations(alice, {
	interactionTypes: [InteractionType.BUY],
	maxDepth: 3
});

// Find "Users who viewed this also bought" for laptop
const viewedAlsoBought = recommendationSystem.getInteractionBasedRecommendations(laptop, InteractionType.VIEW, InteractionType.BUY);
```

#### Interaction Types

The recommendation system supports different types of interactions, each with a default distance value (lower distance means stronger connection):

- `BUY` (distance: 1) - Strongest connection
- `LIKE` (distance: 2)
- `COMMENT` (distance: 3)
- `SHARE` (distance: 4)
- `VIEW` (distance: 5) - Weakest connection

You can customize these distances when recording interactions:

```typescript
recommendationSystem.recordInteraction(
	user,
	product,
	InteractionType.VIEW,
	{ distance: 3 } // Custom distance
);
```

#### Filtering Recommendations

You can filter recommendations by:

1. Interaction types:

```typescript
const recommendations = recommendationSystem.getRecommendations(user, {
	interactionTypes: [InteractionType.BUY, InteractionType.LIKE]
});
```

2. Node properties:

```typescript
const recommendations = recommendationSystem.getRecommendations(user, {
	nodeFilter: node => node.entity === 'product' && node.get('category') === 'electronics'
});
```

#### PageRank-Based Recommendations

The recommendation system also supports PageRank-based recommendations, which can identify influential products in the network:

```typescript
// Get recommendations based on PageRank algorithm
const pageRankRecommendations = recommendationSystem.getPageRankRecommendations(user, {
	count: 5,
	maxDepth: 3
});

// Get hybrid recommendations that combine collaborative filtering with PageRank
const hybridRecommendations = recommendationSystem.getHybridPageRankRecommendations(user, {
	interactionTypes: [InteractionType.BUY],
	count: 5,
	maxDepth: 3
});
```

PageRank-based recommendations are particularly useful for:

- Finding popular products that are central to the interaction network
- Discovering influential items that connect different user communities
- Balancing popularity with personalization in the hybrid approach

The hybrid approach combines the strengths of both collaborative filtering and PageRank:

- Collaborative filtering provides personalized recommendations based on similar users
- PageRank identifies globally important products in the network
- The hybrid method weights both factors to provide balanced recommendations

### Hybrid Search Algorithm

The hybrid search algorithm combines aspects of both breadth-first and priority-based searching to efficiently find paths in complex graphs. It's particularly useful for graphs with:

- Varying edge distances
- Highly connected nodes
- Complex path requirements

```typescript
// Create a complex network
const graph = new Graph();

// Create nodes
const nodeA = graph.createNode('location', { name: 'A' });
const nodeB = graph.createNode('location', { name: 'B' });
const nodeC = graph.createNode('location', { name: 'C' });
const nodeD = graph.createNode('location', { name: 'D' });
const nodeE = graph.createNode('location', { name: 'E' });

// Create edges with different distances
graph.createEdge('path').link(nodeA, nodeB).setDistance(1);
graph.createEdge('path').link(nodeB, nodeC).setDistance(2);
graph.createEdge('path').link(nodeC, nodeD).setDistance(1);
graph.createEdge('path').link(nodeA, nodeE).setDistance(1);
graph.createEdge('path').link(nodeE, nodeD).setDistance(3);

// Use hybrid search to find paths weighted by both distance and connection count
const paths = graph.closest(nodeA, {
	algorithm: 'hybrid',
	direction: 0,
	count: 10,
	minDepth: 0,
	maxDepth: 5
});

// The hybrid algorithm gives priority to:
// 1. Nodes with shorter distances from the source
// 2. Nodes with more connections (higher degree)
// This balances finding short paths with finding important/hub nodes
```

The hybrid algorithm considers both the distance from the starting node and the number of connections a node has when prioritizing the search. This makes it effective for:

- Finding shortest paths in most cases
- Discovering well-connected nodes that might be important junctions
- Handling graphs with varying density and structure

The priority calculation uses a weighted formula that considers:

- `distance` - How far the node is from the starting point
- `connectionCount` - How many edges the node has (adjustable by direction)

This makes the hybrid algorithm more sophisticated than a simple breadth-first or Dijkstra's algorithm, especially in complex real-world networks.

### PageRank Algorithm

The PageRank algorithm can identify the most important or influential nodes in your graph. This is particularly useful for:

```typescript
// Create a citation network
const graph = new Graph();

// Create papers
const papers = [
	graph.createNode('paper', { title: 'Graph Theory Fundamentals' }),
	graph.createNode('paper', { title: 'Advanced Network Analysis' }),
	graph.createNode('paper', { title: 'PageRank Applications' }),
	graph.createNode('paper', { title: 'Social Network Dynamics' }),
	graph.createNode('paper', { title: 'Recommendation Systems' })
];

// Create citation links (directed edges)
// Paper 0 is cited by papers 1, 2, and 3
graph.createEdge('cites').link(papers[1], papers[0]);
graph.createEdge('cites').link(papers[2], papers[0]);
graph.createEdge('cites').link(papers[3], papers[0]);

// Paper 1 is cited by papers 2 and 4
graph.createEdge('cites').link(papers[2], papers[1]);
graph.createEdge('cites').link(papers[4], papers[1]);

// Find the most influential papers using PageRank
const influentialPapers = graph.closest(papers[0], {
	algorithm: 'pagerank',
	direction: 0,
	minDepth: 0,
	maxDepth: 3
});

// Parameters for PageRank can be customized
const customPageRank = new PageRank(graph, {
	dampingFactor: 0.85, // Probability of following links (default: 0.85)
	maxIterations: 100, // Maximum iterations for convergence (default: 100)
	tolerance: 1e-6 // Convergence threshold (default: 1e-6)
});

// Get top 5 nodes by PageRank score
const topNodes = customPageRank.getTopNodes(5);
```

### Custom File Storage

```typescript
// Provide custom file reading/writing functions
const graph = new Graph({
	readFile: async filename => {
		// Custom implementation to read files
		return buffer;
	},
	writeFile: async (filename, data) => {
		// Custom implementation to write files
	}
});
```

### Visualization with Mermaid

The library includes support for exporting graphs in Mermaid format, making it easy to visualize your graph structures:

```typescript
// Generate Mermaid diagram code
const mermaidCode = graph.toMermaid();
console.log(mermaidCode);
```

Example output:

```
graph TD
    12345["person (name: Alice, age: 30)"]
    12344["person (name: Bob, age: 25)"]
    12343["person (name: Charlie, age: 35)"]
    12345 --> |"knows (1)"| 12344
    12344 --> |"knows (2)"| 12343
```

This can be rendered using any Mermaid-compatible tool to create visualizations of your graph structure.

## License

MIT © [Felipe Rohde](mailto:feliperohdee@gmail.com)

## Contributing

Contributions, issues, and feature requests are welcome!

## Author

**Felipe Rohde**

- Twitter: [@felipe_rohde](https://twitter.com/felipe_rohde)
- Github: [@feliperohdee](https://github.com/feliperohdee)
- Email: feliperohdee@gmail.com

## Show your support

Give a ⭐️ if this project helped you!
