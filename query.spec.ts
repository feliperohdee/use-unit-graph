import { describe, it, expect, beforeEach } from 'vitest';
import { Query } from './query';
import { Unit } from './unit';

describe('/query', () => {
	let units: Unit[];
	let query: Query;

	beforeEach(() => {
		units = [
			new Unit('person', { id: '1', name: 'Alice', age: '30', active: true }),
			new Unit('person', { id: '2', name: 'Bob', age: '25', active: true }),
			new Unit('person', { id: '3', name: 'Charlie', age: '35', active: false }),
			new Unit('person', { id: '4', name: 'David', age: '40', active: true }),
			new Unit('person', { id: '5', name: 'Eve', age: '22', active: false })
		];
		query = new Query(units);
	});

	describe('constructor', () => {
		it('should create a Query with the given units', () => {
			expect(query.units()).toEqual(units);
		});
	});

	describe('filter', () => {
		it('should filter units by exact match (is)', () => {
			const result = query.filter({ name: 'Alice' });
			expect(result.units()).toHaveLength(1);
			expect(result.units()[0].get('name')).toBe('Alice');
		});

		it('should filter units by negation (not)', () => {
			const result = query.filter({ name__not: 'Alice' });
			expect(result.units()).toHaveLength(4);
			expect(result.units().map(u => u.get('name'))).not.toContain('Alice');
		});

		it('should filter units by greater than (gt)', () => {
			const result = query.filter({ age__gt: '30' });
			expect(result.units()).toHaveLength(2);
			expect(result.units().map(u => u.get('name'))).toEqual(['Charlie', 'David']);
		});

		it('should filter units by less than (lt)', () => {
			const result = query.filter({ age__lt: '30' });
			expect(result.units()).toHaveLength(2);
			expect(result.units().map(u => u.get('name'))).toEqual(['Bob', 'Eve']);
		});

		it('should filter units by greater than or equal (gte)', () => {
			const result = query.filter({ age__gte: '30' });
			expect(result.units()).toHaveLength(3);
			expect(result.units().map(u => u.get('name'))).toEqual(['Alice', 'Charlie', 'David']);
		});

		it('should filter units by less than or equal (lte)', () => {
			const result = query.filter({ age__lte: '30' });
			expect(result.units()).toHaveLength(3);
			expect(result.units().map(u => u.get('name'))).toEqual(['Alice', 'Bob', 'Eve']);
		});

		it('should filter units by case-insensitive substring (ilike)', () => {
			const result = query.filter({ name__ilike: 'a' });
			expect(result.units()).toHaveLength(3);
			expect(result.units().map(u => u.get('name'))).toEqual(['Alice', 'Charlie', 'David']);
		});

		it('should filter units by case-sensitive substring (like)', () => {
			const result = query.filter({ name__like: 'a' });
			const filteredNames = result.units().map(u => u.get('name'));
			expect(filteredNames).toContain('David');

			expect(filteredNames).not.toContain('Alice');
		});

		it('should filter units by inclusion in array (in)', () => {
			const result = query.filter({ name__in: ['Alice', 'Bob', 'Eve'] });
			expect(result.units()).toHaveLength(3);
			expect(result.units().map(u => u.get('name'))).toEqual(['Alice', 'Bob', 'Eve']);
		});

		it('should filter units by exclusion from array (not_in)', () => {
			const result = query.filter({ name__not_in: ['Alice', 'Bob', 'Eve'] });
			expect(result.units()).toHaveLength(2);
			expect(result.units().map(u => u.get('name'))).toEqual(['Charlie', 'David']);
		});

		it('should support multiple filters (AND within an object)', () => {
			const result = query.filter({ age__gte: '30', active: true });
			expect(result.units()).toHaveLength(2);
			expect(result.units().map(u => u.get('name'))).toEqual(['Alice', 'David']);
		});

		it('should support multiple filter objects (OR between objects)', () => {
			const result = query.filter({ age__lt: '30', active: true }, { age__gt: '35' });
			expect(result.units()).toHaveLength(2);
			expect(result.units().map(u => u.get('name'))).toEqual(['Bob', 'David']);
		});
	});

	describe('exclude', () => {
		it('should exclude units by exact match', () => {
			const result = query.exclude({ name: 'Alice' });
			expect(result.units()).toHaveLength(4);
			expect(result.units().map(u => u.get('name'))).not.toContain('Alice');
		});

		it('should exclude units by multiple criteria', () => {
			const result = query.exclude({ active: true });
			expect(result.units()).toHaveLength(2);
			expect(result.units().map(u => u.get('name'))).toEqual(['Charlie', 'Eve']);
		});
	});

	describe('first', () => {
		it('should return the first unit in the query', () => {
			expect(query.first()).toBe(units[0]);
		});

		it('should return undefined for an empty query', () => {
			const emptyQuery = new Query([]);
			expect(emptyQuery.first()).toBeUndefined();
		});
	});

	describe('last', () => {
		it('should return the last unit in the query', () => {
			expect(query.last()).toBe(units[4]);
		});

		it('should return undefined for an empty query', () => {
			const emptyQuery = new Query([]);
			expect(emptyQuery.last()).toBeUndefined();
		});
	});

	describe('units', () => {
		it('should return a copy of the units array', () => {
			const returnedUnits = query.units();
			expect(returnedUnits).toEqual(units);
			expect(returnedUnits).not.toBe(units); // Should be a different array instance
		});
	});
});
