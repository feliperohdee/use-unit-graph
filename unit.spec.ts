import { describe, it, expect } from 'vitest';

import Unit from './unit';

describe('/unit', () => {
	describe('constructor', () => {
		it('should create a Unit with the given entity and properties', () => {
			const unit = new Unit('testEntity', { id: 1, name: 'test' });

			expect(unit.entity).toBe('testEntity');
			expect(unit.properties).toEqual({ id: 1, name: 'test' });
			expect(unit.__uniqid__).toBe('');
		});

		it('should create a Unit with a custom uniqid', () => {
			const unit = new Unit('testEntity', { id: 1 }, 'custom-id');

			expect(unit.entity).toBe('testEntity');
			expect(unit.properties).toEqual({ id: 1 });
			expect(unit.__uniqid__).toBe('custom-id');
		});
	});

	describe('load', () => {
		it('should load properties into the Unit', () => {
			const unit = new Unit('testEntity');
			unit.load({ id: 2, name: 'updated' });

			expect(unit.properties).toEqual({ id: 2, name: 'updated' });
		});
	});

	describe('set', () => {
		it('should set a property value', () => {
			const unit = new Unit('testEntity');
			unit.set('id', 3);

			expect(unit.properties.id).toBe(3);
		});
	});

	describe('unset', () => {
		it('should remove a property', () => {
			const unit = new Unit('testEntity', { id: 4, name: 'test' });
			const result = unit.unset('id');

			expect(result).toBe(true);
			expect(unit.properties).toEqual({ name: 'test' });
		});
	});

	describe('has', () => {
		it('should return true if the property exists', () => {
			const unit = new Unit('testEntity', { id: 5 });

			expect(unit.has('id')).toBe(true);
			expect(unit.has('name')).toBe(false);
		});
	});

	describe('get', () => {
		it('should return the property value', () => {
			const unit = new Unit('testEntity', { id: 6, name: 'test' });

			expect(unit.get('id')).toBe(6);
			expect(unit.get('name')).toBe('test');
			expect(unit.get('nonexistent')).toBeUndefined();
		});
	});

	describe('toString', () => {
		it('should return a string representation of the Unit', () => {
			const unit = new Unit('testEntity', { id: 7 });
			const str = unit.toString();

			expect(str).toContain('Unit');
			expect(str).toContain('testEntity');
			expect(str).toContain('id');
			expect(str).toContain('7');
		});
	});

	describe('valueOf', () => {
		it('should return the same as toString', () => {
			const unit = new Unit('testEntity', { id: 8 });

			expect(unit.valueOf()).toBe(unit.toString());
		});
	});

	describe('toJSON', () => {
		it('should return an array with entity, properties, and uniqid', () => {
			const unit = new Unit('testEntity', { id: 9 }, 'test-id');
			const json = unit.toJSON();

			expect(json).toEqual(['testEntity', { id: 9 }, 'test-id']);
		});
	});
});
