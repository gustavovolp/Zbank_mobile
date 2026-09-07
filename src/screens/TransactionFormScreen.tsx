import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { SelectField } from '../components/SelectField';
import { CATEGORIAS_POR_TIPO, sugerirCategoria } from '../constants/categorias';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useTransactions } from '../contexts/TransactionsContext';
import type { AppStackParamList } from '../navigation/types';
import type { CategoriaValue } from '../constants/categorias';
import type { TransactionType } from '../types/transaction';

const TIPO_OPCOES = [
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferência' },
];

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormErrors {
  valor?: string;
  categoria?: string;
  descricao?: string;
}

export function TransactionFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const transactionId = (route.params as { transactionId?: string } | undefined)?.transactionId;
  const isEdicao = Boolean(transactionId);

  const { getTransactionById, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const transacaoExistente = transactionId ? getTransactionById(transactionId) : undefined;

  const [tipo, setTipo] = useState<TransactionType>('deposito');
  const [categoria, setCategoria] = useState<CategoriaValue | undefined>(undefined);
  const [categoriaEditadaManualmente, setCategoriaEditadaManualmente] = useState(false);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState(hojeISO());
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);
  const [erros, setErros] = useState<FormErrors>({});
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    if (transacaoExistente) {
      setTipo(transacaoExistente.tipo);
      setCategoria(transacaoExistente.categoria);
      setCategoriaEditadaManualmente(true);
      setValor(String(transacaoExistente.valor));
      setDescricao(transacaoExistente.descricao);
      setData(transacaoExistente.data);
    }
  }, [transacaoExistente]);

  const categoriaOpcoes = useMemo(
    () => CATEGORIAS_POR_TIPO[tipo].map((c) => ({ value: c.value, label: c.label })),
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
    setCategoria(value as CategoriaValue);
    setCategoriaEditadaManualmente(true);
  }

  function validar(): boolean {
    const novosErros: FormErrors = {};
    const valorNumerico = Number(valor.replace(',', '.'));

    if (!valor.trim() || Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      novosErros.valor = 'Informe um valor numérico maior que zero.';
    }
    if (!categoria) {
      novosErros.categoria = 'Selecione uma categoria.';
    }
    if (!descricao.trim() || descricao.trim().length < 3) {
      novosErros.descricao = 'A descrição precisa ter pelo menos 3 caracteres.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  async function handleSalvar() {
    if (!validar() || !categoria) return;

    setSalvando(true);
    try {
      const input = {
        valor: Number(valor.replace(',', '.')),
        tipo,
        categoria,
        descricao: descricao.trim(),
        data,
      };

      if (isEdicao && transactionId) {
        await updateTransaction(transactionId, input);
      } else {
        await addTransaction(input);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro ao salvar', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir() {
    if (!transactionId) return;
    Alert.alert('Excluir transação', 'Tem certeza que deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setExcluindo(true);
          try {
            await deleteTransaction(transactionId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Erro ao excluir', err instanceof Error ? err.message : 'Tente novamente.');
          } finally {
            setExcluindo(false);
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>{isEdicao ? 'Editar transação' : 'Nova transação'}</Text>

        <SelectField label="Tipo" value={tipo} options={TIPO_OPCOES} onChange={handleTipoChange} />

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
          {mostrarDatePicker && (
            <DateTimePicker
              value={new Date(`${data}T00:00:00`)}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selecionada) => {
                setMostrarDatePicker(Platform.OS === 'ios');
                if (selecionada) setData(selecionada.toISOString().slice(0, 10));
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
  salvar: { marginTop: spacing.md, marginBottom: spacing.sm },
});
