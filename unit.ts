type Properties = {
	[key: string]: any;
};

class Unit {
	entity: string;
	__uniqid__: string;
	properties: Properties = Object.create(null);

	constructor(entity: string, properties?: Properties, uniqid?: string) {
		this.entity = entity + '';
		this.__uniqid__ = uniqid || '';
		this.load(properties || {});
	}

	load(properties: Properties): this {
		const p: Properties = Object.create(null);

		Object.keys(properties).forEach(function (v) {
			p[v] = properties[v];
		});

		this.properties = p;

		return this;
	}

	set(property: string, value: any): any {
		return (this.properties[property] = value);
	}

	unset(property: string): boolean {
		return delete this.properties[property];
	}

	has(property: string): boolean {
		return Object.prototype.hasOwnProperty.call(this.properties, property);
	}

	get(property: string): any {
		return this.properties[property];
	}

	toString(): string {
		return [this.constructor.name, ' (', this.entity, ' ', JSON.stringify(this.properties), ')'].join('');
	}

	valueOf(): string {
		return this.toString();
	}

	toJSON(): any[] {
		return [this.entity, this.properties, this.__uniqid__];
	}
}

export default Unit;
