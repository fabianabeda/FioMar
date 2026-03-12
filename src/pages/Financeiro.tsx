import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, Wallet, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

interface Transacao {
    id: string;
    tipo: 'receita' | 'despesa';
    descricao: string;
    valor: number;
    data: string;
    status?: string;
}

export default function Financeiro() {
    const navigate = useNavigate();
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);

    // Controle do Modal de Gastos
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [novoGasto, setNovoGasto] = useState({ descricao: "", valor: "", data_gasto: format(new Date(), 'yyyy-MM-dd') });

    useEffect(() => {
        loadFinanceiro();
    }, []);

    const loadFinanceiro = async () => {
        setLoading(true);
        try {
            // 1. Puxa os pedidos concluídos/entregues (Receitas)
            const { data: pedidos, error: erroPedidos } = await supabase
                .from("pedidos")
                .select("id, clientes(nome_completo), valor, data_entrega, status, produto")
                .in("status", ["concluido", "entregue"]);

            if (erroPedidos) throw erroPedidos;

            // 2. Puxa os gastos registrados (Despesas)
            const { data: gastos, error: erroGastos } = await supabase
                .from("gastos")
                .select("*");

            if (erroGastos) throw erroGastos;

            // 3. Junta tudo numa lista só
            const listaReceitas: Transacao[] = (pedidos || []).map(p => ({
                id: p.id,
                tipo: 'receita',
                descricao: `Venda: ${p.produto} (${p.clientes?.nome_completo})`,
                valor: Number(p.valor),
                data: p.data_entrega,
                status: p.status
            }));

            const listaDespesas: Transacao[] = (gastos || []).map(g => ({
                id: g.id,
                tipo: 'despesa',
                descricao: g.descricao,
                valor: Number(g.valor),
                data: g.data_gasto
            }));

            // Ordena da mais recente para a mais antiga
            const tudoJunto = [...listaReceitas, ...listaDespesas].sort((a, b) =>
                new Date(b.data).getTime() - new Date(a.data).getTime()
            );

            setTransacoes(tudoJunto);
        } catch (error) {
            toast.error("Erro ao carregar os dados financeiros.");
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarGasto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoGasto.descricao || !novoGasto.valor) return toast.error("Preencha descrição e valor!");

        setSalvando(true);
        try {
            const { error } = await supabase.from("gastos").insert([{
                descricao: novoGasto.descricao,
                valor: parseFloat(novoGasto.valor.replace(',', '.')),
                data_gasto: novoGasto.data_gasto
            }]);

            if (error) throw error;

            toast.success("Despesa registrada com sucesso!");
            setModalAberto(false);
            setNovoGasto({ descricao: "", valor: "", data_gasto: format(new Date(), 'yyyy-MM-dd') });
            loadFinanceiro();
        } catch (error) {
            toast.error("Erro ao registrar o gasto.");
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluirGasto = async (id: string, descricao: string) => {
        if (!confirm(`Tem certeza que deseja excluir o gasto '${descricao}'?`)) return;
        try {
            const { error } = await supabase.from("gastos").delete().eq("id", id);
            if (error) throw error;
            toast.success("Gasto removido.");
            loadFinanceiro();
        } catch (error) {
            toast.error("Erro ao excluir gasto.");
        }
    };

    // Cálculos dos Totais
    const totais = useMemo(() => {
        return transacoes.reduce((acc, curr) => {
            if (curr.tipo === 'receita') acc.receitas += curr.valor;
            if (curr.tipo === 'despesa') acc.despesas += curr.valor;
            acc.saldo = acc.receitas - acc.despesas;
            return acc;
        }, { receitas: 0, despesas: 0, saldo: 0 });
    }, [transacoes]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-cyan-600">Calculando finanças...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-14 w-auto cursor-pointer" onClick={() => navigate("/")} />
                    <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Painel
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Meu Caixa</h1>
                        <p className="text-slate-500 text-sm mt-1">Controle de receitas e despesas</p>
                    </div>
                    <Button
                        className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-rose-100"
                        onClick={() => setModalAberto(true)}
                    >
                        <Plus className="h-5 w-5 mr-2" /> REGISTRAR GASTO
                    </Button>
                </div>

                {/* CARDS DE RESUMO (O GRANDE DESTAQUE) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                            <div className="bg-green-100 p-2 rounded-xl text-green-600"><TrendingUp className="h-5 w-5" /></div>
                            <span className="font-bold text-sm uppercase tracking-widest">Entradas (Vendas)</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">R$ {totais.receitas.toFixed(2)}</p>
                    </Card>

                    <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                            <div className="bg-rose-100 p-2 rounded-xl text-rose-600"><TrendingDown className="h-5 w-5" /></div>
                            <span className="font-bold text-sm uppercase tracking-widest">Saídas (Materiais)</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900">R$ {totais.despesas.toFixed(2)}</p>
                    </Card>

                    <Card className={`p-6 rounded-[2rem] border-none shadow-lg ${totais.saldo >= 0 ? 'bg-cyan-600' : 'bg-rose-600'} text-white`}>
                        <div className="flex items-center gap-3 mb-2 text-white/80">
                            <div className="bg-white/20 p-2 rounded-xl text-white"><Wallet className="h-5 w-5" /></div>
                            <span className="font-bold text-sm uppercase tracking-widest">Lucro Líquido</span>
                        </div>
                        <p className="text-4xl font-black">R$ {totais.saldo.toFixed(2)}</p>
                    </Card>
                </div>

                {/* EXTRATO (LISTA DE TRANSAÇÕES) */}
                <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-slate-400" /> Extrato Completo
                </h3>

                <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100">
                    {transacoes.length === 0 ? (
                        <div className="text-center py-10">
                            <DollarSign className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold">Nenhuma movimentação registrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transacoes.map((t, i) => (
                                <div key={`${t.id}-${i}`} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${t.tipo === 'receita' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {t.tipo === 'receita' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800">{t.descricao}</p>
                                            <p className="text-xs font-bold text-slate-400">
                                                {t.data ? format(parseISO(t.data), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                                                {t.status && <span className="ml-2 uppercase text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{t.status}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-lg font-black ${t.tipo === 'receita' ? 'text-green-600' : 'text-rose-600'}`}>
                                            {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                                        </span>
                                        {/* Só permite excluir se for um Gasto manual. Venda a gente altera lá nos Pedidos */}
                                        {t.tipo === 'despesa' && (
                                            <button onClick={() => handleExcluirGasto(t.id, t.descricao)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL PARA REGISTRAR GASTO */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="max-w-sm p-6 bg-white rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-black mb-2">Registrar Gasto</DialogTitle></DialogHeader>
                    <form onSubmit={handleSalvarGasto} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="font-bold text-[10px] uppercase tracking-widest">Data do Gasto</Label>
                            <Input type="date" value={novoGasto.data_gasto} onChange={e => setNovoGasto({...novoGasto, data_gasto: e.target.value})} required className="h-12 rounded-xl bg-slate-50 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-[10px] uppercase tracking-widest">O que você comprou?</Label>
                            <Input placeholder="Ex: Linhas, Bojos, Embalagens..." value={novoGasto.descricao} onChange={e => setNovoGasto({...novoGasto, descricao: e.target.value})} required className="h-12 rounded-xl bg-slate-50 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold text-[10px] uppercase tracking-widest text-rose-600">Valor (R$)</Label>
                            <Input type="number" step="0.01" placeholder="0,00" value={novoGasto.valor} onChange={e => setNovoGasto({...novoGasto, valor: e.target.value})} required className="h-12 rounded-xl bg-rose-50 border-rose-200 font-black text-rose-700" />
                        </div>
                        <Button type="submit" className="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-lg" disabled={salvando}>
                            {salvando ? "SALVANDO..." : "SALVAR DESPESA"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}