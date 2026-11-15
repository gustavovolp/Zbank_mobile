import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/core/presentation/store/hooks';
import type { AppStackParamList } from '@/core/presentation/navigation/types';
import type { FieldErrors } from '@/core/domain/errors';
import { Button } from '@/core/presentation/components/Button';
import { FormField } from '@/core/presentation/components/FormField';
import { SelectField } from '@/core/presentation/components/SelectField';
import { alertarAcao, confirmarAcao } from '@/core/presentation/confirm';
import { fromIsoDate, toLocalIsoDate } from '@/core/presentation/dates';
import { parseMoney } from '@/core/presentation/parseMoney';
import { colors, fonts, radius, spacing } from '@/core/presentation/theme';
import { CATEGORIAS_POR_TIPO, sugerirCategoria } from '../../domain/categories';
import type { TransactionType } from '../../domain/entities';
import { validateTransactionDraft, type TransactionDraft } from '../../domain/validation';
import { selectTransactionById } from '../state/selectors';
import { addTransaction, removeTransaction, updateTransaction } from '../state/transactionsSlice';

const TIPO_OPCOES = [
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferência' },
];

export function TransactionFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const transactionId = (route.params as { transactionId?: string } | undefined)?.transactionId;
  const isEdicao = Boolean(transactionId);
  const transacaoExistente = useAppSelector((state) => selectTransactionById(state, transactionId));

  const [tipo, setTipo] = useState<TransactionType>('deposito');
  const [categoria, setCategoria] = useState<string | undefined>(undefined);
  const [categoriaEditadaManualmente, setCategoriaEditadaManualmente] = useState(false);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(() => toLocalIsoDate(new Date()));
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [erros, setErros] = useState<FieldErrors>({});
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const preenchido = useRef(false);

  useEffect(() => {
    if (!transacaoExistente || preenchido.current) return;
    preenchido.current = true;
    setTipo(transacaoExistente.tipo);
    setCategoria(transacaoExistente.categoria);
    setCategoriaEditadaManualmente(true);
    setValor(transacaoExistente.valor.toFixed(2).replace('.', ','));
    setDescricao(transacaoExistente.descricao);
    setData(transacaoExistente.data);
  }, [transacaoExistente]);

  const categoriaOpcoes = useMemo(
    () => CATEGORIAS_POR_TIPO[tipo].map((c) => ({ value: c.value as string, label: c.label as string })),
    [tipo]
  );

  function handleTipoChange(novoTipo: string) {
    setTipo(novoTipo as TransactionType);
    setCategoria(undefined);
    setCategoriaEditadaManualmente(false);
  }

  function handleDescricaoChange(texto: string) {
    setDescricao(texto);
    if (!categoriaEditadaManualmente) {
      const sugestao = sugerirCategoria(texto, tipo);
      if (sugestao) setCategoria(sugestao);
    }
  }

  function handleCategoriaChange(value: string) {
    setCategoria(value);
    setCategoriaEditadaManualmente(true);
  }

  async function handleSalvar() {
    const draft: TransactionDraft = { valor: parseMoney(valor), tipo, categoria, descricao, data };
    const errosValidacao = validateTransactionDraft(draft);
    setErros(errosValidacao);
    if (Object.keys(errosValidacao).length > 0) return;

    setSalvando(true);
    const result =
      isEdicao && transactionId
        ? await dispatch(updateTransaction({ id: transactionId, draft }))
        : await dispatch(addTransaction(draft));
    setSalvando(false);

    if (result.meta.requestStatus === 'rejected') {
      alertarAcao('Erro ao salvar', (result.payload as string | undefined) ?? 'Tente novamente.');
      return;
    }
    navigation.goBack();
  }

  async function handleExcluir() {
    if (!transactionId) return;
    const confirmou = await confirmarAcao(
      'Excluir transação',
      'Tem certeza que deseja excluir esta transação?',
      'Excluir'
    );
    if (!confirmou) return;

    setExcluindo(true);
    const result = await dispatch(removeTransaction(transactionId));
    setExcluindo(false);

    if (result.meta.requestStatus === 'rejected') {
      alertarAcao('Erro ao excluir', (result.payload as string | undefined) ?? 'Tente novamente.');
      return;
    }
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>{isEdicao ? 'Editar transação' : 'Nova transação'}</Text>

        <SelectField label="Tipo" value={tipo} options={TIPO_OPCOES} onChange={handleTipoChange} error={erros.tipo} />

        <FormField
          label="Valor (R$)"
          value={valor}
          onChangeText={setValor}
          placeholder="0,00"
          keyboardType="decimal-pad"
          error={erros.valor}
        />

        <SelectField
          label="Categoria"
          value={categoria}
          options={categoriaOpcoes}
          onChange={handleCategoriaChange}
          placeholder="Selecione a categoria"
          error={erros.categoria}
        />

        <FormField
          label="Descrição"
          value={descricao}
          onChangeText={handleDescricaoChange}
          placeholder="Ex: Supermercado, Salário..."
          error={erros.descricao}
        />

        <View style={styles.campo}>
          <Text style={styles.label}>Data</Text>
          <Pressable style={styles.dataTrigger} onPress={() => setMostrarDatePicker(true)}>
            <Text style={styles.dataTexto}>{data}</Text>
          </Pressable>
          {erros.data ? <Text style={styles.erroCampo}>{erros.data}</Text> : null}
          {mostrarDatePicker && (
            <DateTimePicker
              value={fromIsoDate(data)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selecionada) => {
                setMostrarDatePicker(Platform.OS === 'ios');
                if (selecionada) setData(toLocalIsoDate(selecionada));
              }}
            />
          )}
        </View>

        <Button label="Salvar" onPress={handleSalvar} loading={salvando} style={styles.salvar} />

        {isEdicao && (
          <Button
            label="Excluir transação"
            variant="danger"
            icon="trash"
            onPress={handleExcluir}
            loading={excluindo}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  titulo: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  campo: { marginBottom: spacing.md },
  label: { color: colors.neutral, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  dataTrigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  dataTexto: { fontSize: 16, color: colors.text },
  erroCampo: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  salvar: { marginTop: spacing.md, marginBottom: spacing.sm },
});
