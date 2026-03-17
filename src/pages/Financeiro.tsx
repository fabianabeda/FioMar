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
import {
    ArrowLeft,
    Plus,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Wallet,
    Calendar as CalendarIcon,
    Trash2,
    PiggyBank,
    ReceiptText
} from "lucide-react";
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
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [novoGasto, setNovoGasto] = useState({ descricao: "", valor: "", data_gasto: format(new Date(), 'yyyy-MM-dd') });

    useEffect(() => {
        loadFinanceiro();
    }, []);

    const loadFinanceiro = async () => {
        setLoading(true);
        try {
            const { data: pedidos, error: erroPedidos } = await supabase
                .from("pedidos")
                .select("id, clientes(nome_completo), valor, data_entrega, status, produto")
                .in("status", ["concluido", "entregue"]);

            if (erroPedidos) throw erroPedidos;

            const { data: gastos, error: erroGastos } = await supabase
                .from("gastos")
                .select("*");

            if (erroGastos) throw erroGastos;

            const listaReceitas: Transacao[] = (pedidos || []).map(p => ({
                id: p.id,
                tipo: 'receita',
                descricao: `${p.produto} • ${p.clientes?.nome_completo.split(' ')[0]}`,
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

            const tudoJunto = [...listaReceitas, ...listaDespesas].sort((a, b) =>
                new Date(b.data).getTime() - new Date(a.data).getTime()
            );

            setTransacoes(tudoJunto);
        } catch (error) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    };

    const handleSalvarGasto = async (e: React.FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        try {
            const { error } = await supabase.from("gastos").insert([{
                descricao: novoGasto.descricao,
                valor: parseFloat(novoGasto.valor.replace(',', '.')),
                data_gasto: novoGasto.data_gasto
            }]);
            if (error) throw error;
            toast.success("Gasto registrado! 💸");
            setModalAberto(false);
            setNovoGasto({ descricao: "", valor: "", data_gasto: format(new Date(), 'yyyy-MM-dd') });
            loadFinanceiro();
        } catch (error) {
            toast.error("Erro ao salvar.");
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluirGasto = async (id: string) => {
        try {
            const { error } = await supabase.from("gastos").delete().eq("id", id);
            if (error) throw error;
            toast.success("Removido.");
            loadFinanceiro();
        } catch (error) {
            toast.error("Erro ao excluir.");
        }
    };

    const totais = useMemo(() => {
        return transacoes.reduce((acc, curr) => {
            if (curr.tipo === 'receita') acc.receitas += curr.valor;
            if (curr.tipo === 'despesa') acc.despesas += curr.valor;
            acc.saldo = acc.receitas - acc.despesas;
            return acc;
        }, { receitas: 0, despesas: 0, saldo: 0 });
    }, [transacoes]);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-cyan-600 uppercase tracking-widest">Contando Moedas...</div>;

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg" onClick={() => navigate("/")} />
                    <Button variant="ghost" size="sm" className="font-bold text-slate-400" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Painel
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* TÍTULO ESTILIZADO */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
                    <div className="text-center md:text-left">
                        <h1 className="leading-tight flex flex-col md:flex-row md:items-baseline">
                            <span className="text-7xl md:text-8xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Meu</span>
                            <span className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-[0.2em] ml-0 md:ml-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Caixa</span>
                        </h1>
                    </div>
                    <Button
                        className="w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white font-black h-16 px-8 rounded-2xl shadow-xl shadow-rose-100 uppercase tracking-widest text-xs"
                        onClick={() => setModalAberto(true)}
                    >
                        <Plus className="h-5 w-5 mr-3" /> Registrar Gasto
                    </Button>
                </div>

                {/* RESUMO FINANCEIRO EM CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-green-50 p-3 rounded-2xl text-green-500 group-hover:scale-110 transition-transform"><TrendingUp className="h-6 w-6" /></div>
                            <span className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Entradas</span>
                        </div>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">R$ {totais.receitas.toFixed(2)}</p>
                    </Card>

                    <Card className="p-8 rounded-[2.5rem] border-none shadow-sm bg-white group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-rose-50 p-3 rounded-2xl text-rose-500 group-hover:scale-110 transition-transform"><TrendingDown className="h-6 w-6" /></div>
                            <span className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Saídas</span>
                        </div>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">R$ {totais.despesas.toFixed(2)}</p>
                    </Card>

                    <Card className={`p-8 rounded-[2.5rem] border-none shadow-2xl ${totais.saldo >= 0 ? 'bg-cyan-600' : 'bg-rose-600'} text-white relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                            <PiggyBank className="h-24 w-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-white/20 p-3 rounded-2xl"><Wallet className="h-6 w-6 text-white" /></div>
                                <span className="font-black text-white/80 text-[10px] uppercase tracking-[0.2em]">Lucro Real</span>
                            </div>
                            <p className="text-4xl font-black tracking-tighter">R$ {totais.saldo.toFixed(2)}</p>
                        </div>
                    </Card>
                </div>

                {/* EXTRATO */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 pl-2">
                        <ReceiptText className="h-5 w-5 text-cyan-500" />
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Histórico de Movimentações</h3>
                    </div>

                    <div className="bg-white rounded-[3rem] p-6 shadow-sm border border-slate-50 overflow-hidden">
                        {transacoes.length === 0 ? (
                            <div className="text-center py-20">
                                <DollarSign className="h-16 w-16 text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-300 font-black uppercase tracking-widest text-xs">O caixa está vazio por enquanto.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {transacoes.map((t, i) => (
                                    <div key={`${t.id}-${i}`} className="flex items-center justify-between py-6 px-2 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${t.tipo === 'receita' ? 'bg-green-50 text-green-500' : 'bg-rose-50 text-rose-500'} shadow-inner`}>
                                                {t.tipo === 'receita' ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{t.descricao}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {t.data ? format(parseISO(t.data), "dd 'de' MMMM", { locale: ptBR }) : '-'}
                                                    </p>
                                                    {t.status && (
                                                        <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase tracking-tighter px-2">
                                                            {t.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className={`text-xl font-black ${t.tipo === 'receita' ? 'text-green-500' : 'text-rose-500'}`}>
                                                {t.tipo === 'receita' ? '+' : '-'} <span className="text-xs">R$</span> {t.valor.toFixed(2)}
                                            </span>
                                            {t.tipo === 'despesa' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleExcluirGasto(t.id)}
                                                    className="text-slate-200 hover:text-rose-400 rounded-xl"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* MODAL REGISTRAR GASTO */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="max-w-md p-0 bg-white rounded-[3rem] border-none shadow-2xl overflow-hidden">
                    <div className="bg-rose-500 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-widest text-center" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                Novo Gasto
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSalvarGasto} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Data da Compra</Label>
                            <Input type="date" value={novoGasto.data_gasto} onChange={e => setNovoGasto({...novoGasto, data_gasto: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">O que foi comprado?</Label>
                            <Input placeholder="Ex: Tecidos, Aviamentos, etc" value={novoGasto.descricao} onChange={e => setNovoGasto({...novoGasto, descricao: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-rose-500 uppercase text-[10px] tracking-widest ml-1">Valor do Gasto (R$)</Label>
                            <Input type="number" step="0.01" placeholder="0,00" value={novoGasto.valor} onChange={e => setNovoGasto({...novoGasto, valor: e.target.value})} required className="h-14 rounded-2xl bg-rose-50/50 border-none font-black text-rose-600 text-xl" />
                        </div>
                        <Button type="submit" className="w-full h-16 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-[1.5rem] text-lg uppercase tracking-widest shadow-lg shadow-rose-100 transition-all active:scale-95" disabled={salvando}>
                            {salvando ? "Salvando..." : "Confirmar Saída"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}