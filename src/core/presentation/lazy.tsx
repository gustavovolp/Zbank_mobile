import { Suspense, lazy, type ComponentProps, type ComponentType } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from './theme';

function Fallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

type ExportedComponent<M, K extends keyof M> = M[K] extends ComponentType<infer Props> ? ComponentType<Props> : never;

export function lazyComponent<M, K extends keyof M & string>(loader: () => Promise<M>, exportName: K) {
  type Props = ComponentProps<ExportedComponent<M, K>>;

  const Loaded = lazy(() =>
    loader().then((module) => ({ default: module[exportName] as ExportedComponent<M, K> }))
  );

  const Screen = Loaded as unknown as ComponentType<object>;

  function LazyWrapper(props: Props) {
    return (
      <Suspense fallback={<Fallback />}>
        <Screen {...(props as object)} />
      </Suspense>
    );
  }

  LazyWrapper.preload = loader;
  return LazyWrapper;
}
