# use-unit-graph

A lightweight, flexible graph data structure library with comprehensive TypeScript support.

## Features

- **Flexible Data Model**: Create nodes and edges with custom properties
- **Powerful Querying**: Search nodes and edges by indexed properties
- **Path Finding**: Find shortest paths between nodes with configurable algorithms
- **Collection Management**: Group nodes and edges with efficient indexing
- **Serialization**: Save and load graphs in compressed format
- **TypeScript Support**: Fully typed API for better development experience

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

### Hybrid Search Algorithm

```typescript
// Use the hybrid search algorithm for complex path finding
const paths = graph.closest(startNode, {
	algorithm: 'hybrid'
	// other options...
});
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
