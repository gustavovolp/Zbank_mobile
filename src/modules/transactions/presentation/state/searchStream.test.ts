import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSearchStream } from './searchStream';

describe('createSearchStream', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('só emite depois do tempo de debounce', () => {
    const onTerm = vi.fn();
    const stream = createSearchStream(onTerm, 300);

    stream.next('uber');
    vi.advanceTimersByTime(299);
    expect(onTerm).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTerm).toHaveBeenCalledWith('uber');
  });

  it('digitação rápida gera uma única emissão com o último valor', () => {
    const onTerm = vi.fn();
    const stream = createSearchStream(onTerm, 300);

    stream.next('u');
    vi.advanceTimersByTime(100);
    stream.next('ub');
    vi.advanceTimersByTime(100);
    stream.next('uber');
    vi.advanceTimersByTime(300);

    expect(onTerm).toHaveBeenCalledTimes(1);
    expect(onTerm).toHaveBeenCalledWith('uber');
  });

  it('remove espaços das pontas e ignora valores repetidos', () => {
    const onTerm = vi.fn();
    const stream = createSearchStream(onTerm, 300);

    stream.next(' uber ');
    vi.advanceTimersByTime(300);
    stream.next('uber');
    vi.advanceTimersByTime(300);

    expect(onTerm).toHaveBeenCalledTimes(1);
  });

  it('flush emite na hora e cancela a digitação pendente', () => {
    const onTerm = vi.fn();
    const stream = createSearchStream(onTerm, 300);

    stream.next('uber');
    vi.advanceTimersByTime(300);
    stream.next('ube');
    stream.flush('');
    vi.advanceTimersByTime(1000);

    expect(onTerm.mock.calls.map(([term]) => term)).toEqual(['uber', '']);
  });

  it('permite buscar o mesmo termo de novo depois de limpar', () => {
    const onTerm = vi.fn();
    const stream = createSearchStream(onTerm, 300);

    stream.next('uber');
    vi.advanceTimersByTime(300);
    stream.flush('');
    stream.next('uber');
    vi.advanceTimersByTime(300);

    expect(onTerm.mock.calls.map(([term]) => term)).toEqual(['uber', '', 'uber']);
  });

  it('dispose interrompe as emissões', () => {
    const onTerm = vi.fn();
    const stream = createSearchStream(onTerm, 300);

    stream.next('uber');
    stream.dispose();
    vi.advanceTimersByTime(1000);

    expect(onTerm).not.toHaveBeenCalled();
  });
});
