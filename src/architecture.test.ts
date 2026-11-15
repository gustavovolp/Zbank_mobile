import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)));

interface SourceFile {
  path: string;
  imports: string[];
}

function collect(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return collect(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

const toPosix = (path: string) => path.split(sep).join('/');

function readImports(file: string): string[] {
  const content = readFileSync(file, 'utf8');
  const specifiers = new Set<string>();
  for (const match of content.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)) {
    specifiers.add(match[1]);
  }
  return [...specifiers];
}

function resolveInternal(from: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) return toPosix(join(SRC, specifier.slice(2)));
  if (specifier.startsWith('.')) return toPosix(resolve(dirname(from), specifier));
  return null;
}

const sources: SourceFile[] = collect(SRC)
  .filter((file) => !/\.test\.tsx?$/.test(file) && !toPosix(file).includes('/src/testing/'))
  .map((file) => ({ path: toPosix(file), imports: readImports(file) }));

const rel = (path: string) => path.replace(`${toPosix(SRC)}/`, '');

function violations(
  filter: (file: SourceFile) => boolean,
  isForbidden: (file: SourceFile, specifier: string, target: string | null) => boolean
): string[] {
  return sources
    .filter(filter)
    .flatMap((file) =>
      file.imports
        .filter((specifier) => isForbidden(file, specifier, resolveInternal(file.path, specifier)))
        .map((specifier) => `${rel(file.path)} -> ${specifier}`)
    );
}

const moduleOf = (path: string) => /\/modules\/([^/]+)(?:\/|$)/.exec(path)?.[1] ?? null;

const inDomain = (path: string) => path.includes('/domain/');
const inModules = (path: string) => path.includes('/src/modules/');
const inShell = (path: string) => path.includes('/src/shell/');
const isCompositionRoot = (path: string) => inShell(path) || path.includes('/src/core/di/');

describe('arquitetura: regra de dependência (Clean Architecture)', () => {
  it('encontra os arquivos de código para analisar', () => {
    expect(sources.length).toBeGreaterThan(50);
  });

  it('o domínio não depende de frameworks (React, Firebase, Redux, Expo, criptografia...)', () => {
    const allowedPackages = new Set(['rxjs']);

    expect(
      violations(
        (file) => inDomain(file.path),
        (_file, specifier, target) => target === null && !allowedPackages.has(specifier)
      )
    ).toEqual([]);
  });

  it('o domínio só enxerga o próprio domínio (nunca infraestrutura, apresentação ou o shell)', () => {
    expect(
      violations(
        (file) => inDomain(file.path),
        (_file, _specifier, target) => target !== null && !inDomain(target)
      )
    ).toEqual([]);
  });

  it('a infraestrutura nunca depende da apresentação nem do shell', () => {
    expect(
      violations(
        (file) => file.path.includes('/infrastructure/'),
        (_file, _specifier, target) =>
          target !== null && (target.includes('/presentation/') || inShell(target))
      )
    ).toEqual([]);
  });

  it('a apresentação não acessa a infraestrutura diretamente (só via casos de uso injetados)', () => {
    expect(
      violations(
        (file) => file.path.includes('/presentation/'),
        (_file, _specifier, target) => target !== null && target.includes('/infrastructure/')
      )
    ).toEqual([]);
  });
});

describe('arquitetura: modularidade', () => {
  it('o núcleo (core) não conhece nenhuma feature nem o shell — só a raiz de composição (core/di) conhece', () => {
    expect(
      violations(
        (file) => file.path.includes('/src/core/') && !isCompositionRoot(file.path),
        (_file, _specifier, target) => target !== null && (inModules(target) || inShell(target))
      )
    ).toEqual([]);
  });

  it('os módulos não dependem do shell (a dependência vai do shell para os módulos, nunca o contrário)', () => {
    expect(
      violations(
        (file) => inModules(file.path),
        (_file, _specifier, target) => target !== null && inShell(target)
      )
    ).toEqual([]);
  });

  it('um módulo só acessa outro módulo pela API pública (index.ts), nunca por arquivos internos', () => {
    expect(
      violations(
        (file) => inModules(file.path) && !isCompositionRoot(file.path),
        (file, _specifier, target) => {
          if (!target) return false;
          const other = moduleOf(target);
          return other !== null && other !== moduleOf(file.path) && !target.endsWith(`/modules/${other}`);
        }
      )
    ).toEqual([]);
  });

  it('os módulos "auth" e "transactions" são independentes entre si', () => {
    const independent = new Set(['auth', 'transactions']);

    expect(
      violations(
        (file) => independent.has(moduleOf(file.path) ?? ''),
        (file, _specifier, target) => {
          if (!target) return false;
          const other = moduleOf(target);
          return other !== null && other !== moduleOf(file.path) && independent.has(other);
        }
      )
    ).toEqual([]);
  });

  it('a API pública dos módulos expõe só lógica, sem arquivos de interface (.tsx)', () => {
    const publicApis = sources.filter((file) => /\/src\/modules\/[^/]+\/index\.ts$/.test(file.path));

    expect(publicApis.length).toBeGreaterThanOrEqual(3);
    expect(
      publicApis.flatMap((file) =>
        file.imports
          .filter((specifier) => /(?:Screen|\.tsx)$/.test(specifier))
          .map((specifier) => `${rel(file.path)} -> ${specifier}`)
      )
    ).toEqual([]);
  });
});

describe('arquitetura: convenções do projeto', () => {
  it('nenhum arquivo de código tem comentários de linha', () => {
    const withComments = sources
      .filter((file) => /^\s*\/\/(?!\s*eslint)/m.test(readFileSync(file.path, 'utf8')))
      .map((file) => rel(file.path));

    expect(withComments).toEqual([]);
  });
});
