import { Unit } from './unit';

// Forward declaration to avoid circular dependency
import type { Edge } from './edge';

export class Node extends Unit {
	edges: Edge[];
	inputEdges: Edge[];
	outputEdges: Edge[];

	constructor(entity: string, properties?: { [key: string]: any }, uniqid?: string) {
		super(entity, properties, uniqid);
		this.edges = [];
		this.inputEdges = [];
		this.outputEdges = [];
	}

	unlink(): boolean {
		const edges = this.edges;

		for (let i = 0, len = edges.length; i < len; i++) {
			edges[i].unlink();
		}

		return true;
	}

	toJSON(): any[] {
		return super.toJSON();
	}
}
