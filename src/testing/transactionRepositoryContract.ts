import { describe, expect, it } from 'vitest';
import type { Transaction, TransactionInput } from '@/modules/transactions/domain/entities';
import type { TransactionRepository } from '@/modules/transactions/domain/TransactionRepository';

const UID = 'u1';

const input = (overrides: Partial<TransactionInput> = {}): TransactionInput => ({
  valor: 10,
  tipo: 'transferencia',
  data: '2026-03-20',
  descricao: 'Lançamento',
  categoria: 'lazer',
  ...overrides,
});

const page = (repository: TransactionRepository, overrides: { filters?: object; cursor?: string | null; size?: number } = {}) =>
  repository.listPage(UID, {
    filters: overrides.filters ?? {},
    cursor: overrides.cursor ?? null,
    pageSize: overrides.size ?? 10,
  });

export function describeTransactionRepositoryContract(name: string, createRepository: () => TransactionRepository) {
  describe(`contrato do TransactionRepository: ${name}`, () => {
    it('add devolve a entidade criada com id, criadoEm e os mesmos dados', async () => {
      const repository = createRepository();

      const created = await repository.add(UID, input({ descricao: 'Mercado' }), 1234);

      expect(created).toMatchObject({ descricao: 'Mercado', valor: 10, criadoEm: 1234 });
      expect(created.id).toBeTruthy();
    });

    it('lista da mais recente para a mais antiga (criadoEm)', async () => {
      const repository = createRepository();
      await repository.add(UID, input({ descricao: 'antiga' }), 100);
      await repository.add(UID, input({ descricao: 'nova' }), 300);
      await repository.add(UID, input({ descricao: 'meio' }), 200);

      const { items } = await page(repository);

      expect(items.map((t) => t.descricao)).toEqual(['nova', 'meio', 'antiga']);
    });

    it('pagina com cursor sem repetir nem perder itens', async () => {
      const repository = createRepository();
      for (let index = 1; index <= 5; index += 1) {
        await repository.add(UID, input({ descricao: `item ${index}` }), index);
      }

      const first = await page(repository, { size: 2 });
      const second = await page(repository, { size: 2, cursor: first.nextCursor });
      const third = await page(repository, { size: 2, cursor: second.nextCursor });

      const all = [...first.items, ...second.items, ...third.items].map((t) => t.descricao);
      expect(all).toEqual(['item 5', 'item 4', 'item 3', 'item 2', 'item 1']);
      expect(third.nextCursor).toBeNull();
    });

    it('aplica filtros de tipo, categoria e intervalo de datas (inclusivo)', async () => {
      const repository = createRepository();
      await repository.add(UID, input({ descricao: 'a', tipo: 'deposito', categoria: 'salario', data: '2026-01-10' }), 1);
      await repository.add(UID, input({ descricao: 'b', tipo: 'transferencia', categoria: 'lazer', data: '2026-02-10' }), 2);
      await repository.add(UID, input({ descricao: 'c', tipo: 'transferencia', categoria: 'moradia', data: '2026-03-10' }), 3);

      const byTipo = await page(repository, { filters: { tipo: 'transferencia' } });
      const byCategoria = await page(repository, { filters: { categoria: 'salario' } });
      const byDate = await page(repository, { filters: { dataInicio: '2026-02-10', dataFim: '2026-03-10' } });

      expect(byTipo.items.map((t) => t.descricao).sort()).toEqual(['b', 'c']);
      expect(byCategoria.items.map((t) => t.descricao)).toEqual(['a']);
      expect(byDate.items.map((t) => t.descricao).sort()).toEqual(['b', 'c']);
    });

    it('uma escrita aparece na próxima leitura, mesmo que a lista já tenha sido lida antes (sem dado velho)', async () => {
      const repository = createRepository();
      const created = await repository.add(UID, input({ descricao: 'original' }), 1);
      await page(repository);

      await repository.add(UID, input({ descricao: 'segunda' }), 2);
      expect((await page(repository)).items.map((t) => t.descricao)).toEqual(['segunda', 'original']);

      await repository.update(UID, created.id, input({ descricao: 'editada', valor: 99 }));
      const afterUpdate = (await page(repository)).items.find((t) => t.id === created.id);
      expect(afterUpdate).toMatchObject({ descricao: 'editada', valor: 99, criadoEm: 1 });

      await repository.remove(UID, created.id);
      expect((await page(repository)).items.map((t) => t.descricao)).toEqual(['segunda']);
    });

    it('force ignora qualquer cache e devolve o estado atual', async () => {
      const repository = createRepository();
      await repository.add(UID, input({ descricao: 'um' }), 1);
      await page(repository);
      await repository.add(UID, input({ descricao: 'dois' }), 2);

      const forced = await repository.listPage(UID, { filters: {}, cursor: null, pageSize: 10 }, { force: true });

      expect(forced.items).toHaveLength(2);
    });

    it('isola os dados por usuário', async () => {
      const repository = createRepository();
      await repository.add('u1', input({ descricao: 'do u1' }), 1);
      await repository.add('u2', input({ descricao: 'do u2' }), 1);

      const result = await repository.listPage('u2', { filters: {}, cursor: null, pageSize: 10 });

      expect(result.items.map((t) => t.descricao)).toEqual(['do u2']);
    });

    it('observeRecent emite o estado atual e cada mudança, e para depois de cancelar', async () => {
      const repository = createRepository();
      const snapshots: number[] = [];

      const subscription = repository.observeRecent(UID, 300).subscribe((items: Transaction[]) => {
        snapshots.push(items.length);
      });
      await repository.add(UID, input(), 1);
      await repository.add(UID, input(), 2);
      subscription.unsubscribe();
      await repository.add(UID, input(), 3);

      expect(snapshots).toEqual([0, 1, 2]);
    });
  });
}
