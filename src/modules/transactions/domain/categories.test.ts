import { describe, expect, it } from 'vitest';
import { findCategoryLabel, isCategoryOfType, obterLabelCategoria, sugerirCategoria } from './categories';

describe('sugerirCategoria', () => {
  it('sugere categoria de despesa a partir da descrição', () => {
    expect(sugerirCategoria('Corrida de Uber', 'transferencia')).toBe('transporte');
    expect(sugerirCategoria('Farmácia São João', 'transferencia')).toBe('saude');
  });

  it('ignora acentos e maiúsculas', () => {
    expect(sugerirCategoria('SALÁRIO de março', 'deposito')).toBe('salario');
  });

  it('só sugere categorias do tipo informado', () => {
    expect(sugerirCategoria('Salário', 'transferencia')).toBeNull();
  });

  it('retorna null para descrição vazia ou desconhecida', () => {
    expect(sugerirCategoria('   ', 'deposito')).toBeNull();
    expect(sugerirCategoria('xyz qualquer', 'deposito')).toBeNull();
  });
});

describe('labels e pertencimento', () => {
  it('resolve o label de uma categoria', () => {
    expect(obterLabelCategoria('deposito', 'salario')).toBe('Salário');
    expect(findCategoryLabel('moradia')).toBe('Moradia');
    expect(findCategoryLabel('inexistente')).toBe('inexistente');
  });

  it('valida se a categoria pertence ao tipo', () => {
    expect(isCategoryOfType('deposito', 'salario')).toBe(true);
    expect(isCategoryOfType('deposito', 'moradia')).toBe(false);
  });
});
