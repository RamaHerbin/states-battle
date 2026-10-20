/// <reference types="vitest/config" />
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: 5191,
		fs: {
			allow: ['.']
		}
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
