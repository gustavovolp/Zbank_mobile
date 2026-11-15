import { Subject, debounce, distinctUntilChanged, map, of, timer } from 'rxjs';

export interface SearchStream {
  next(term: string): void;
  flush(term: string): void;
  dispose(): void;
}

interface SearchInput {
  term: string;
  immediate: boolean;
}

export function createSearchStream(onTerm: (term: string) => void, debounceMs = 300): SearchStream {
  const input$ = new Subject<SearchInput>();

  const subscription = input$
    .pipe(
      debounce(({ immediate }) => (immediate ? of(0) : timer(debounceMs))),
      map(({ term }) => term.trim()),
      distinctUntilChanged()
    )
    .subscribe(onTerm);

  return {
    next: (term) => input$.next({ term, immediate: false }),
    flush: (term) => input$.next({ term, immediate: true }),
    dispose: () => subscription.unsubscribe(),
  };
}
