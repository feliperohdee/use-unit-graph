import { describe, it, expect, beforeEach } from 'vitest';
import { Collection } from './collection';
import { Unit } from './unit';

describe('/collection', () => {
	let collection: Collection;
	let unit1: Unit;
	let unit2: Unit;

	beforeEach(() => {
		collection = new Collection('testCollection');
		unit1 = new Unit('testEntity', { id: '1', name: 'Unit 1' });
		unit2 = new Unit('testEntity', { id: '2', name: 'Unit 2' });
	});

	describe('constructor', () => {
		it('should create a Collection with the given name', () => {
			expect(collection.name()).toBe('testCollection');
			expect(collection.indices()).toEqual([]);
		});
	});

	describe('createIndex', () => {
		it('should create an index for the specified field', () => {
			collection.createIndex('id');
			expect(collection.indices()).toEqual(['id']);
		});
	});

	describe('createIndices', () => {
		it('should create indices for multiple fields', () => {
			collection.createIndices(['id', 'name']);
			expect(collection.indices()).toEqual(['id', 'name']);
		});
	});

	describe('_add', () => {
		it('should add a unit to the collection', () => {
			collection.createIndex('id');
			const result = collection._add(unit1);

			expect(result).toBe(unit1);

			// Test that we can find the unit by its index
			expect(collection.find('id', '1')).toBe(unit1);
		});
	});

	describe('_remove', () => {
		beforeEach(() => {
			collection.createIndex('id');
			collection._add(unit1);
			collection._add(unit2);
		});

		it('should remove a unit from the collection', () => {
			const result = collection._remove(unit1);

			expect(result).toBe(unit1);
			expect(collection.find('id', '1')).toBeUndefined();
			expect(collection.find('id', '2')).toBe(unit2);
		});
	});

	describe('find', () => {
		beforeEach(() => {
			collection.createIndices(['id', 'name']);
			collection._add(unit1);
			collection._add(unit2);
		});

		it('should find a unit by its index and id', () => {
			expect(collection.find('id', '1')).toBe(unit1);
			expect(collection.find('id', '2')).toBe(unit2);
			expect(collection.find('name', 'Unit 1')).toBe(unit1);
			expect(collection.find('name', 'Unit 2')).toBe(unit2);
		});

		it('should use the first index if only id is provided', () => {
			expect(collection.find('1')).toBe(unit1);
			expect(collection.find('2')).toBe(unit2);
		});

		it('should return undefined for non-existent units', () => {
			expect(collection.find('id', '3')).toBeUndefined();
			expect(collection.find('name', 'Unit 3')).toBeUndefined();
		});
	});

	describe('destroy', () => {
		beforeEach(() => {
			collection.createIndices(['id', 'name']);
			collection._add(unit1);
			collection._add(unit2);
		});

		it('should remove and return a unit by its index and id', () => {
			const result = collection.destroy('id', '1');

			expect(result).toBe(unit1);
			expect(collection.find('id', '1')).toBeUndefined();
			expect(collection.find('id', '2')).toBe(unit2);
		});

		it('should use the first index if only id is provided', () => {
			const result = collection.destroy('2');

			expect(result).toBe(unit2);
			expect(collection.find('id', '2')).toBeUndefined();
		});
	});

	describe('query', () => {
		beforeEach(() => {
			collection._add(unit1);
			collection._add(unit2);
		});

		it('should return a Query object with all units', () => {
			const query = collection.query();
			const units = query.units();

			expect(units).toHaveLength(2);
			expect(units).toContain(unit1);
			expect(units).toContain(unit2);
		});
	});

	describe('toJSON', () => {
		beforeEach(() => {
			collection.createIndices(['id', 'name']);
		});

		it('should return an array with name and indices', () => {
			const json = collection.toJSON();

			expect(json).toEqual(['testCollection', ['id', 'name']]);
		});
	});
});
