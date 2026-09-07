import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import { colors, radius, spacing } from '../constants/theme';
import { useTransactions } from '../contexts/TransactionsContext';
import type { AppStackParamList } from '../navigation/types';
import {
  formatarTamanhoArquivo,
  TAMANHO_MAXIMO_ANEXO,
  validarArquivoAnexo,
  type ArquivoSelecionado,
} from '../utils/anexoUtils';
import type { CategoriaValue } from '../constants/categorias';
import type { Anexo, TransactionType } from '../types/transaction';

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
  anexo?: string;
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
  const [arquivo, setArquivo] = useState<ArquivoSelecionado | null>(null);
  const [anexoExistente, setAnexoExistente] = useState<Anexo | null>(null);
  const [removerAnexo, setRemoverAnexo] = useState(false);
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
      setAnexoExistente(transacaoExistente.anexo ?? null);
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

  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos para anexar o recibo.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (resultado.canceled || !resultado.assets?.[0]) return;

    const asset = resultado.assets[0];
    const selecionado: ArquivoSelecionado = {
      uri: asset.uri,
      nome: asset.fileName ?? `foto-${Date.now()}.jpg`,
      tipoArquivo: asset.mimeType ?? 'image/jpeg',
      tamanho: asset.fileSize ?? 0,
    };
    aplicarArquivoSelecionado(selecionado);
  }

  async function escolherDocumento() {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
    });
    if (resultado.canceled || !resultado.assets?.[0]) return;

    const asset = resultado.assets[0];
    const selecionado: ArquivoSelecionado = {
      uri: asset.uri,
      nome: asset.name,
      tipoArquivo: asset.mimeType ?? 'application/pdf',
      tamanho: asset.size ?? 0,
    };
    aplicarArquivoSelecionado(selecionado);
  }

  function aplicarArquivoSelecionado(selecionado: ArquivoSelecionado) {
    const erro = validarArquivoAnexo(selecionado);
    if (erro) {
      setErros((prev) => ({ ...prev, anexo: erro }));
      return;
    }
    setErros((prev) => ({ ...prev, anexo: undefined }));
    setArquivo(selecionado);
    setRemoverAnexo(false);
  }

  function removerAnexoSelecionado() {
    setArquivo(null);
    if (anexoExistente) setRemoverAnexo(true);
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
        await updateTransaction(transactionId, input, {
          novoArquivo: arquivo ?? undefined,
          removerAnexo,
        });
      } else {
        await addTransaction(input, arquivo);
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

  const anexoAtivo = arquivo
    ? { tipoArquivo: arquivo.tipoArquivo, uri: arquivo.uri, nome: arquivo.nome }
    : !removerAnexo && anexoExistente
      ? { tipoArquivo: anexoExistente.tipoArquivo, uri: anexoExistente.url, nome: anexoExistente.nome }
      : null;
  const mostrarPreviewImagem = anexoAtivo?.tipoArquivo.startsWith('image/') ?? false;

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

        <View style={styles.campo}>
          <Text style={styles.label}>Anexo (recibo)</Text>
          <Text style={styles.ajuda}>
            JPG, PNG ou PDF, até {formatarTamanhoArquivo(TAMANHO_MAXIMO_ANEXO)}.
          </Text>

          {anexoAtivo && mostrarPreviewImagem ? (
            <Image source={{ uri: anexoAtivo.uri }} style={styles.preview} />
          ) : anexoAtivo ? (
            <View style={styles.previewPdf}>
              <Text style={styles.previewPdfTexto}>📄 {anexoAtivo.nome}</Text>
            </View>
          ) : null}

          {erros.anexo ? <Text style={styles.erroAnexo}>{erros.anexo}</Text> : null}

          <View style={styles.anexoBotoes}>
            <Button label="Escolher foto" variant="secondary" onPress={escolherImagem} style={styles.anexoBotao} />
            <Button label="Escolher PDF" variant="ghost" onPress={escolherDocumento} style={styles.anexoBotao} />
          </View>

          {anexoAtivo && <Button label="Remover anexo" variant="ghost" onPress={removerAnexoSelecionado} />}
        </View>

        <Button label="Salvar" onPress={handleSalvar} loading={salvando} style={styles.salvar} />

        {isEdicao && (
          <Button label="Excluir transação" variant="danger" onPress={handleExcluir} loading={excluindo} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  campo: { marginBottom: spacing.md },
  label: { color: colors.neutral, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  ajuda: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
  dataTrigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
  },
  dataTexto: { fontSize: 16, color: colors.text },
  preview: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  previewPdf: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  previewPdfTexto: { color: colors.text },
  erroAnexo: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  anexoBotoes: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  anexoBotao: { flex: 1 },
  salvar: { marginTop: spacing.md, marginBottom: spacing.sm },
});
