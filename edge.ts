import { Unit } from './unit';

// Forward declaration to avoid circular dependency
import type { Node } from './node';

export class Edge extends Unit {
	inputNode: Node | null;
	outputNode: Node | null;
	duplex: boolean;
	distance: number;

	constructor(entity: string, properties?: { [key: string]: any }, uniqid?: string) {
		super(entity, properties, uniqid);

		this.inputNode = null;
		this.outputNode = null;
		this.duplex = false;

		this.distance = 1;
	}

	_linkTo(node: Node, direction: number): boolean {
		if (direction <= 0) {
			node.inputEdges.push(this);
		}

		if (direction >= 0) {
			node.outputEdges.push(this);
		}

		node.edges.push(this);

		return true;
	}

	link(inputNode: Node, outputNode: Node, duplex?: boolean): this {
		this.unlink();

		this.inputNode = inputNode;
		this.outputNode = outputNode;
		this.duplex = !!duplex;

		if (duplex) {
			this._linkTo(inputNode, 0);
			this._linkTo(outputNode, 0);
			return this;
		}

		this._linkTo(inputNode, 1);
		this._linkTo(outputNode, -1);
		return this;
	}

	setDistance(v: number | string): this {
		this.distance = Math.abs(parseFloat(v as string) || 0);
		return this;
	}

	setWeight(v: number | string): this {
		this.distance = 1 / Math.abs(parseFloat(v as string) || 0);
		return this;
	}

	oppositeNode(node: Node): Node | undefined {
		if (this.inputNode === node) {
			return this.outputNode as Node;
		} else if (this.outputNode === node) {
			return this.inputNode as Node;
		}

		return undefined;
	}

	unlink(): boolean {
		let pos: number;
		const inode = this.inputNode;
		const onode = this.outputNode;

		if (!(inode && onode)) {
			return true;
		}

		(pos = inode.edges.indexOf(this)) > -1 && inode.edges.splice(pos, 1);
		(pos = onode.edges.indexOf(this)) > -1 && onode.edges.splice(pos, 1);
		(pos = inode.outputEdges.indexOf(this)) > -1 && inode.outputEdges.splice(pos, 1);
		(pos = onode.inputEdges.indexOf(this)) > -1 && onode.inputEdges.splice(pos, 1);

		if (this.duplex) {
			(pos = inode.inputEdges.indexOf(this)) > -1 && inode.inputEdges.splice(pos, 1);
			(pos = onode.outputEdges.indexOf(this)) > -1 && onode.outputEdges.splice(pos, 1);
		}

		this.inputNode = null;
		this.outputNode = null;

		this.duplex = false;

		return true;
	}

	toJSON(): any[] {
		const baseJson = super.toJSON();
		return baseJson.concat([this.inputNode?.__uniqid__ || '', this.outputNode?.__uniqid__ || '', this.duplex ? 1 : 0, this.distance]);
	}
}
