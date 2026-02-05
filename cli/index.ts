#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';

const PACKAGE_NAME = '@kitstack/nest-req-ctx';

type AdapterChoice = 'auto' | 'express' | 'fastify';
type SetupTypeChoice = 'middleware' | 'guard' | 'interceptor';

interface CliOptions {
  projectPath: string;
  adapter: AdapterChoice;
  setupType: SetupTypeChoice;
  isGlobal: boolean;
  setRequest: boolean;
  addSetupRequestId: boolean;
  excludeRoutes: string;
}

function findAppModulePath(rootDir: string): string | null {
  const candidates = [
    path.join(rootDir, 'src', 'app.module.ts'),
    path.join(rootDir, 'app.module.ts'),
    path.join(rootDir, 'src', 'app', 'app.module.ts'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function isNestProject(rootDir: string): boolean {
  const pkgPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return !!(deps['@nestjs/core'] || deps['@nestjs/common']);
  } catch {
    return false;
  }
}

function generateModuleConfig(options: CliOptions): string {
  const opts: string[] = [];
  opts.push(`isGlobal: ${options.isGlobal}`);
  opts.push(`adapter: '${options.adapter}'`);
  opts.push(`setupType: '${options.setupType}'`);
  opts.push(`setRequest: ${options.setRequest}`);

  if (options.addSetupRequestId) {
    opts.push(`setup: (ctx, req) => {
        const requestId = req.headers['x-request-id'] || \`req-\${Date.now()}\`;
        ctx.set('requestId', requestId);
      }`);
  }

  if (options.excludeRoutes.trim()) {
    const routes = options.excludeRoutes
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    if (routes.length) {
      opts.push(`exclude: [${routes.map((r) => `'${r}'`).join(', ')}]`);
    }
  }

  return `RequestContextModule.forRoot({
      ${opts.join(',\n      ')},
    })`;
}

function patchAppModule(appModulePath: string, options: CliOptions): void {
  let content = fs.readFileSync(appModulePath, 'utf-8');

  if (content.includes('RequestContextModule') && content.includes(PACKAGE_NAME)) {
    throw new Error('RequestContextModule is already set up in this project.');
  }

  const moduleConfig = generateModuleConfig(options);

  // 1. Add import if missing
  if (!content.includes(PACKAGE_NAME)) {
    const insertImport = `import { RequestContextModule } from '${PACKAGE_NAME}';\n`;
    // Find the last import statement to insert after
    const importRegex = /^import .+;$/gm;
    let lastImportMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(content)) !== null) {
      lastImportMatch = match;
    }

    if (lastImportMatch) {
      const insertPos = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertPos) + "\n" + insertImport + content.slice(insertPos);
    } else {
      content = insertImport + content;
    }
  }

  // 2. Add RequestContextModule to imports array
  const importsArrayRegex = /imports:\s*\[\s*/;
  if (!importsArrayRegex.test(content)) {
    throw new Error('Could not find "imports: [" in the root @Module. Ensure app.module.ts has a standard Nest structure.');
  }
  content = content.replace(
    importsArrayRegex,
    `imports: [\n    ${moduleConfig},\n    `,
  );

  fs.writeFileSync(appModulePath, content, 'utf-8');
}

function runInstall(projectPath: string): void {
  execSync(`npm install ${PACKAGE_NAME} --save`, {
    cwd: projectPath,
    stdio: 'inherit',
    shell: true,
  });
}

async function main(): Promise<void> {
  console.log('\n  @kitstack/nest-req-ctx — NestJS Request Context setup\n');

  const projectPath = path.resolve(process.cwd());

  const answers = await inquirer.prompt<CliOptions>([
    {
      type: 'input',
      name: 'projectPath',
      message: 'Path to your NestJS project (leave empty for current directory):',
      default: projectPath,
      transformer: (input: string) => (input.trim() || projectPath),
    },
    {
      type: 'list',
      name: 'adapter',
      message: 'Which HTTP adapter do you use?',
      choices: [
        { name: 'Auto-detect (Express or Fastify)', value: 'auto' },
        { name: 'Express', value: 'express' },
        { name: 'Fastify', value: 'fastify' },
      ],
      default: 'auto',
    },
    {
      type: 'list',
      name: 'setupType',
      message: 'How should request context be initialized?',
      choices: [
        { name: 'Middleware (recommended)', value: 'middleware' },
        { name: 'Guard', value: 'guard' },
        { name: 'Interceptor', value: 'interceptor' },
      ],
      default: 'middleware',
    },
    {
      type: 'confirm',
      name: 'isGlobal',
      message: 'Register the module globally?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'setRequest',
      message: 'Store the request object in context?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'addSetupRequestId',
      message: 'Add a setup that stores x-request-id (or generated ID) in context?',
      default: true,
    },
    {
      type: 'input',
      name: 'excludeRoutes',
      message: 'Routes to exclude from context (comma-separated, e.g. /health,/metrics). Leave empty for none:',
      default: '',
    },
  ]);

  const resolvedPath = path.resolve(answers.projectPath.trim() || projectPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`\nError: Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  if (!isNestProject(resolvedPath)) {
    console.error('\nError: This directory does not look like a NestJS project (no @nestjs/core in package.json).');
    process.exit(1);
  }

  const appModulePath = findAppModulePath(resolvedPath);
  if (!appModulePath) {
    console.error('\nError: Could not find app.module.ts (looked in src/app.module.ts, app.module.ts, src/app/app.module.ts).');
    process.exit(1);
  }

  console.log('\nInstalling @kitstack/nest-req-ctx...');
  runInstall(resolvedPath);

  console.log('Updating app.module.ts...');
  try {
    patchAppModule(appModulePath, answers);
  } catch (err) {
    console.error('\nError:', (err as Error).message);
    process.exit(1);
  }

  console.log('\nDone. RequestContextModule has been added to your app.\n');
  console.log('Next steps:');
  console.log('  • Use @Req(), @ContextValue(), @InjectContext() in your controllers and services.');
  console.log('  • See: https://github.com/ALIRAZA47/nest-req-ctx#readme\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
