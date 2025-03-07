import Edge from './edge';
import Node from './node';

type PathElement = Node | Edge;

class Path {
	private _raw: PathElement[];

	constructor(array: PathElement[]) {
		this._raw = array.slice();
	}

	start(): PathElement {
		return this._raw[0];
	}

	end(): PathElement {
		return this._raw[this._raw.length - 1];
	}

	length(): number {
		return this._raw.length >>> 1;
	}

	distance(): number {
		return this._raw
			.filter((v, i) => {
				return !!(i & 1);
			})
			.reduce((p, c) => {
				return p + (c as Edge).distance;
			}, 0);
	}

	prettify(): string {
		const arr = this._raw;

		return arr
			.map((v, i, arr) => {
				const str = v.toString();

				if (i & 1) {
					const edge = v as Edge;
					if (edge.duplex) {
						return ['<>', str, '<>'].join(' ');
					}

					const p = arr[i - 1] as Node;

					if (edge.inputNode === p) {
						return ['>>', str, '>>'].join(' ');
					}

					return ['<<', str, '<<'].join(' ');
				}

				return str;
			})
			.join(' ');
	}

	toString(): string {
		return this.prettify();
	}
}

export default Path;
