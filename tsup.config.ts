import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: [
        '@nestjs/common',
        '@nestjs/core',
        'reflect-metadata',
        'rxjs',
        'express',
        'fastify',
        '@nestjs/platform-express',
        '@nestjs/platform-fastify',
    ],
    target: 'es2021',
    outDir: 'dist',
});
