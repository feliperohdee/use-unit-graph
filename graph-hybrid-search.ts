import Edge from './edge';
import Node from './node';
import Path from './path';

type TracedPath = { [key: string]: Node[] };

class HybridSearch {
	_buildPath(node: Node, traced: TracedPath) {
		let path = traced[node._uniqid_];

		while (path[0] instanceof Edge) {
			let edge = path[0];
			let prevNode = edge.oppositeNode(path[1]);

			path = traced[prevNode!._uniqid_].concat(path);
		}

		return new Path(path);
	}

	search(
		startNode: Node,
		passCondition: ((node: Node) => boolean) | undefined,
		count?: number,
		direction?: number,
		minDepth?: number,
		maxDepth?: number
	) {
		const finalPassCondition = typeof passCondition === 'function' ? passCondition : () => true;
		const finalDirection = (direction || 0) | 0;
		const finalCount = Math.max(0, (count || 0) | 0);
		const finalMinDepth = Math.max(0, (minDepth || 0) | 0);
		const finalMaxDepth = Math.max(0, (maxDepth || 0) | 0);

		let nodePath = Object.create(null);
		nodePath[startNode._uniqid_] = [startNode];

		let priorityQueue: { node: Node; distance: number; priority: number }[] = [];

		const calculatePriority = (node: Node, distance: number): number => {
			let connectionCount =
				finalDirection === 0 ? node.edges.length : finalDirection > 0 ? node.outputEdges.length : node.inputEdges.length;

			const distanceWeight = 0.7;
			const connectionsWeight = 0.3;

			let normalizedConnections = connectionCount / 100;
			let normalizedDistance = 1 / (distance + 1);

			return distanceWeight * normalizedDistance + connectionsWeight * normalizedConnections;
		};

		const enqueue = (node: Node, distance: number): void => {
			let priority = calculatePriority(node, distance);

			let inserted = false;
			for (let i = 0; i < priorityQueue.length; i++) {
				if (priority > priorityQueue[i].priority) {
					priorityQueue.splice(i, 0, { node, distance, priority });
					inserted = true;
					break;
				}
			}

			if (!inserted) {
				priorityQueue.push({ node, distance, priority });
			}
		};

		enqueue(startNode, 0);

		let found = [];
		let visited = new Set([startNode._uniqid_]);

		while (priorityQueue.length > 0) {
			let current = priorityQueue.shift();
			let node = current!.node;
			let curDistance = current!.distance;

			if (finalMaxDepth && curDistance > finalMaxDepth) {
				continue;
			}

			if (curDistance >= finalMinDepth && finalPassCondition(node)) {
				found.push(this._buildPath(node, nodePath));

				if (finalCount && found.length >= finalCount) {
					break;
				}
			}

			let edges = finalDirection === 0 ? node.edges : finalDirection > 0 ? node.outputEdges : node.inputEdges;

			for (let i = 0; i < edges.length; i++) {
				let edge = edges[i];
				let nextDistance = curDistance + edge.distance;
				let nextNode = edge.oppositeNode(node) as Node;

				if (!visited.has(nextNode._uniqid_)) {
					visited.add(nextNode._uniqid_);
					nodePath[nextNode._uniqid_] = [edge, nextNode];
					enqueue(nextNode, nextDistance);
				}
			}
		}

		return found;
	}
}

export default HybridSearch;
