import Query from './query';
import Unit from './unit';

class Collection {
	protected _name: string;
	protected _units: Unit[];
	protected _indices: { [key: string]: { [key: string]: Unit } };
	protected _indicesList: string[];

	constructor(name: string) {
		this._name = name;
		this._units = [];
		this._indices = Object.create(null);
		this._indicesList = [];
	}

	name(): string {
		return this._name;
	}

	indices(): string[] {
		return this._indicesList.slice();
	}

	toJSON(): [string, string[]] {
		return [this._name, this._indicesList.slice()];
	}

	createIndex(field: string): this {
		return this.createIndices([field]);
	}

	createIndices(fieldList: string[]): this {
		this._indicesList = this._indicesList.concat(fieldList);
		const indices = this._indices;
		const units = this._units;

		for (let i = 0, len = fieldList.length; i < len; i++) {
			const index = fieldList[i];
			const lookup = (indices[index] = Object.create(null));

			for (let u = 0, ulen = units.length; u < ulen; u++) {
				const unit = units[u];
				const id = unit.get(index);
				id && (lookup[id] = unit);
			}
		}

		return this;
	}

	_add(unit: Unit): Unit {
		if (unit) {
			this._units.push(unit);

			const list = this._indicesList;
			const len = list.length;
			const indices = this._indices;

			for (let i = 0; i < len; i++) {
				const index = list[i];
				const lookup = indices[index];
				const id = unit.get(index);
				id && (lookup[id] = unit);
			}
		}

		return unit;
	}

	_remove(unit: Unit): Unit {
		if (unit) {
			const pos = this._units.indexOf(unit);
			pos > -1 && this._units.splice(pos, 1);

			const list = this._indicesList;
			const len = list.length;
			const indices = this._indices;

			for (let i = 0; i < len; i++) {
				const index = list[i];
				const lookup = indices[index];
				const id = unit.get(index);
				delete lookup[id];
			}
		}

		return unit;
	}

	find(index: string, id?: string): Unit | undefined {
		if (!id) {
			id = index;
			index = this._indicesList[0];
		}

		const lookup = this._indices[index];
		return lookup && lookup[id];
	}

	destroy(index: string, id?: string): Unit | undefined {
		if (!id) {
			id = index;
			index = this._indicesList[0];
		}

		const lookup = this._indices[index];
		return lookup && this._remove(lookup[id]);
	}

	query(): Query {
		return new Query(this._units);
	}
}

export default Collection;
