import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			exclude: ['dist', '**/*.spec.ts', 'index.ts', 'vitest.config.mts'],
			provider: 'v8',
			reporter: ['text', 'html']
		}
	}
});
