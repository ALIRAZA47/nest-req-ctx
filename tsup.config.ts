import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        cli: 'cli/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: { entry: 'src/index.ts' },
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
        'inquirer',
    ],
    target: 'es2021',
    outDir: 'dist',
});
