# use-unit-graph

A lightweight graph data structure library with TypeScript support.

## Installation

```bash
npm install unit-graph
```

## Usage

```typescript
import { Graph, Node, Edge } from 'unit-graph';

// Create a new graph
const graph = new Graph();

// Create nodes
const nodeA = graph.createNode('person', { name: 'Alice', age: 30 });
const nodeB = graph.createNode('person', { name: 'Bob', age: 25 });

// Create an edge between nodes
const edge = graph.createEdge('knows', { since: 2020 });
edge.link(nodeA, nodeB);

// Query the graph
const alicesFriends = nodeA.outputEdges.map(edge => edge.outputNode);
console.log(alicesFriends); // [Node { entity: 'person', properties: { name: 'Bob', age: 25 } }]

// Find paths
const path = graph.trace(nodeA, nodeB);
console.log(path.toString()); // "Node (person {"name":"Alice","age":30}) >> Edge (knows {"since":2020}) >> Node (person {"name":"Bob","age":25})"

// Save and load graphs
graph.save('mygraph.gz', err => {
	if (err) {
		console.error('Error saving graph:', err);
		return;
	}

	const newGraph = new Graph();
	newGraph.load('mygraph.gz', (err, loadedGraph) => {
		if (err) {
			console.error('Error loading graph:', err);
			return;
		}

		console.log('Graph loaded successfully!');
		console.log('Nodes:', loadedGraph.nodeCount());
		console.log('Edges:', loadedGraph.edgeCount());
	});
});
```

## Features

- Create and manage nodes and edges with properties
- Query nodes and edges by properties
- Find paths between nodes
- Save and load graphs to/from files
- TypeScript support with full type definitions

## License

MIT
