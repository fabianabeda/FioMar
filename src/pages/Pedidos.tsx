import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft, Plus, Search, Edit, Package, Clock, Eye, MessageCircle, AlertTriangle, RotateCcw, Send, CheckCircle2, Ruler, Scissors, Palette, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format, isBefore, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import logoImg from "@/assets/logo-fabbis.jpeg";

interface Pedido {
    id: string;
    clientes: { nome_completo: string; telefone?: string; endereco?: string; };
    produto: string;
    tamanho: string;
    cor_frente: string;
    cor_verso: string;
    cor_roletes: string;
    cor_linha: string;
    modelo_cima: string;
    tem_bojo: boolean;
    tipo_lateral_baixo: string;
    modelo_baixo: string;
    data_entrega: string;
    valor: number;
    status: string;
    foto_url?: string | null;
    observacoes?: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    realizados: { label: "Realizados", color: "text-amber-700", bg: "bg-amber-100" },
    em_producao: { label: "Em produção", color: "text-blue-700", bg: "bg-blue-100" },
    finalizados: { label: "Finalizados", color: "text-green-700", bg: "bg-green-100" },
};

export default function Pedidos() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
    const [modalAberto, setModalAberto] = useState(false);

    const currentStatus = searchParams.get("status") || "all";

    useEffect(() => { loadPedidos(); }, []);

    const loadPedidos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("pedidos")
                .select(`*, clientes (nome_completo, telefone, endereco)`)
                .order("data_entrega", { ascending: true });
            if (error) throw error;
            setPedidos(data || []);
        } catch (error) { toast.error("Erro ao carregar"); }
        finally { setLoading(false); }
    };

    const filteredPedidos = useMemo(() => {
        return pedidos.filter((p) => {
            const matchesSearch = p.clientes?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = currentStatus === "all" || p.status === currentStatus;
            return matchesSearch && matchesStatus;
        });
    }, [pedidos, searchTerm, currentStatus]);

    const handleWhatsAppNotificacao = (p: Pedido) => {
        const cleanPhone = p.clientes?.telefone?.replace(/\D/g, "");
        const nomeCliente = p.clientes?.nome_completo.split(' ')[0];
        let mensagem = "";

        if (p.status === 'finalizados') {
            mensagem = `Olá, ${nomeCliente}! %0A%0ASeu pedido de *${p.produto}* da *Fabbis* já está pronto! %0A%0AComo você prefere retirar?`;
        } else {
            mensagem = `Olá, ${nomeCliente}! %0A%0AEstou passando para confirmar seu pedido de *${p.produto}* na *Fabbis*. Ele está com entrega prevista para *${format(parseISO(p.data_entrega), "dd/MM/yyyy")}*!`;
        }
        window.open(`https://wa.me/55${cleanPhone}?text=${mensagem}`, "_blank");
    };

    const getEstiloPrazo = (dataStr: string, status: string) => {
        if (status === 'finalizados' || status === 'cancelado') return "text-slate-400";
        const hoje = new Date();
        const dataEntrega = parseISO(dataStr);
        if (isBefore(dataEntrega, hoje) && !isSameDay(dataEntrega, hoje)) return "text-red-500 font-black animate-pulse";
        if (isSameDay(dataEntrega, hoje)) return "text-amber-500 font-black";
        return "text-[#06B6D4] font-bold";
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from("pedidos").update({ status: newStatus }).eq("id", id);
        if (!error) {
            toast.success(`Status atualizado!`);

            // Atualiza a ficha aberta
            setPedidoSelecionado(prev => prev ? { ...prev, status: newStatus } : null);

            // Atualiza a lista no fundo
            loadPedidos();
        } else {
            toast.error("Erro ao atualizar o status.");
        }
    };

    const handleExcluirPedido = async (id: string, fotoUrl?: string | null) => {
        if (!confirm("Tem certeza que deseja EXCLUIR este pedido permanentemente?")) return;

        try {
            if (fotoUrl) {
                const nomeArq = fotoUrl.split('/').pop();
                if (nomeArq) await supabase.storage.from("pedidos").remove([nomeArq]);
            }

            const { error } = await supabase.from("pedidos").delete().eq("id", id);
            if (error) throw error;

            toast.success("Pedido excluído.");
            setModalAberto(false);
            loadPedidos();
        } catch (error) {
            toast.error("Erro ao excluir o pedido.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[#06B6D4] uppercase tracking-widest">Organizando Ateliê...</div>;

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-10 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');
                  .font-allura { font-family: 'Allura', cursive; }
                  .font-montserrat { font-family: 'Montserrat', sans-serif; }
                `}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg cursor-pointer" onClick={() => navigate("/")} />
                    <div className="flex gap-3">
                        <Button variant="ghost" size="sm" className="font-bold text-slate-400 hover:text-[#06B6D4]" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 mr-2" /> Painel</Button>
                        <Button className="bg-[#06B6D4] hover:bg-[#0891B2] text-white font-black rounded-xl px-6 transition-all active:scale-95" onClick={() => navigate("/pedidos/novo")}><Plus className="h-4 w-4 mr-2" /> NOVO PEDIDO</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="leading-tight flex flex-col md:flex-row md:items-baseline justify-center md:justify-start">
                        <span className="text-7xl md:text-8xl text-[#06B6D4] font-allura">Meus</span>
                        <span className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-[0.2em] ml-0 md:ml-4 font-montserrat">Pedidos</span>
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <Input
                            placeholder="Buscar por nome da cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 h-14 rounded-2xl border-none shadow-sm bg-white text-lg placeholder:text-slate-300 focus:ring-2 focus:ring-[#06B6D4]/10"
                        />
                    </div>
                    <Select value={currentStatus} onValueChange={(val) => setSearchParams({ status: val })}>
                        <SelectTrigger className="w-full md:w-[220px] h-14 rounded-2xl border-none shadow-sm font-bold bg-white text-slate-600">
                            <SelectValue placeholder="Filtrar Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl font-bold">
                            <SelectItem value="all">Todos os Pedidos</SelectItem>
                            {Object.keys(statusConfig).map(k => <SelectItem key={k} value={k}>{statusConfig[k].label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPedidos.length > 0 ? (
                        filteredPedidos.map((pedido) => {
                            const config = statusConfig[pedido.status] || statusConfig.realizados;
                            const estiloPrazo = getEstiloPrazo(pedido.data_entrega, pedido.status);

                            return (
                                <Card
                                    key={pedido.id}
                                    onClick={() => { setPedidoSelecionado(pedido); setModalAberto(true); }}
                                    className="p-5 cursor-pointer hover:shadow-lg transition-all rounded-[2rem] border-none shadow-sm bg-white group overflow-hidden relative"
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${config.bg.replace('bg-', 'bg-')}`} />

                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="h-16 w-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 shadow-inner">
                                            {pedido.foto_url ? <img src={pedido.foto_url} className="h-full w-full object-cover" /> : <Package className="h-full w-full p-4 text-slate-200" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Badge className={`${config.bg} ${config.color} border-none text-[9px] font-black uppercase tracking-widest mb-2 font-montserrat`}>
                                                {config.label}
                                            </Badge>
                                            <h3 className="font-black text-slate-800 uppercase text-sm truncate mb-1 font-montserrat">
                                                {pedido.clientes?.nome_completo}
                                            </h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                {pedido.produto} • TAM {pedido.tamanho}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Entrega prevista</p>
                                            <p className={`text-xs font-black flex items-center gap-1 uppercase ${estiloPrazo}`}>
                                                <Clock className="h-3 w-3" />
                                                {format(parseISO(pedido.data_entrega), "dd/MM/yyyy")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-slate-900">
                                                <span className="text-xs mr-0.5">R$</span>{Number(pedido.valor).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })
                    ) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-[3rem] shadow-sm border-none">
                            <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm font-montserrat">Nenhum pedido por aqui</p>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL FICHA DO PEDIDO */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="max-w-4xl p-0 border-none bg-white rounded-[3rem] overflow-hidden shadow-2xl">
                    {pedidoSelecionado && (() => {
                        const p = pedidoSelecionado;
                        const config = statusConfig[p.status] || statusConfig.realizados;

                        return (
                            <div className="flex flex-col max-h-[90vh]">
                                <div className="bg-slate-900 p-8 text-white relative">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#06B6D4] mb-2 font-montserrat">Ficha de Produção</p>
                                            <DialogTitle className="text-3xl md:text-4xl font-black uppercase tracking-tight font-montserrat">
                                                {p.clientes?.nome_completo}
                                            </DialogTitle>
                                        </div>
                                        <Badge className={`${config.bg} ${config.color} border-none font-black px-6 py-2 rounded-full text-xs uppercase tracking-widest font-montserrat`}>
                                            {config.label}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                                    <Button
                                        className="w-full bg-[#22C55E] hover:bg-[#16A34A] text-white font-black h-16 rounded-[1.5rem] shadow-lg shadow-green-100 text-lg transition-all active:scale-95"
                                        onClick={() => handleWhatsAppNotificacao(p)}
                                    >
                                        <MessageCircle className="h-6 w-6 mr-3 fill-current" />
                                        {p.status === 'finalizados' ? 'AVISAR QUE ESTÁ PRONTO' : 'ENVIAR MENSAGEM PRA CLIENTE'}
                                    </Button>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                                                <h4 className="text-[10px] font-black text-[#06B6D4] uppercase mb-5 flex items-center gap-2 tracking-widest font-montserrat">
                                                    <Scissors className="h-4 w-4" /> Modelagem
                                                </h4>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Produto</p>
                                                        <p className="font-black text-slate-800 text-lg uppercase">{p.produto}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Tamanho</p>
                                                        <p className="font-black text-[#06B6D4] text-2xl">{p.tamanho}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Top</p>
                                                        <p className="text-sm font-bold text-slate-700">{p.modelo_cima}</p>
                                                        <Badge variant="outline" className="mt-1 text-[8px] uppercase font-bold">{p.tem_bojo ? "Com Bojo" : "Sem Bojo"}</Badge>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Calcinha</p>
                                                        <p className="text-sm font-bold text-slate-700">{p.modelo_baixo}</p>
                                                        <p className="text-[9px] text-slate-500 italic mt-1">{p.tipo_lateral_baixo}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-[2rem] p-6 border-2 border-cyan-50 shadow-sm">
                                                <h4 className="text-[10px] font-black text-[#06B6D4] uppercase mb-5 flex items-center gap-2 tracking-widest font-montserrat">
                                                    <Palette className="h-4 w-4" /> Cores
                                                </h4>
                                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                                    <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Frente:</strong> <span className="font-bold text-slate-700">{p.cor_frente}</span></p>
                                                    <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Verso:</strong> <span className="font-bold text-slate-700">{p.cor_verso || '-'}</span></p>
                                                    <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Roletes:</strong> <span className="font-bold text-slate-700">{p.cor_roletes || p.cor_frente}</span></p>
                                                    <p><strong className="text-slate-400 font-bold uppercase text-[9px] block">Linha:</strong> <span className="font-bold text-slate-700">{p.cor_linha || "-"}</span></p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-center">
                                                <div className="bg-slate-100 rounded-[2.5rem] w-full aspect-square max-w-[280px] border-4 border-white shadow-xl overflow-hidden relative">
                                                    {p.foto_url ? (
                                                        <img src={p.foto_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                                                            <Package className="h-12 w-12 mb-2" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Sem Referência</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-[#06B6D4] rounded-[2rem] p-6 text-white shadow-lg shadow-cyan-100">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase opacity-80 mb-1">Prazo de Entrega</p>
                                                        <p className="text-2xl font-black uppercase tracking-tighter">
                                                            {format(parseISO(p.data_entrega), "dd 'de' MMM", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black uppercase opacity-80 mb-1">Valor</p>
                                                        <p className="text-3xl font-black">
                                                            <span className="text-lg mr-1 font-medium opacity-80">R$</span>
                                                            {Number(p.valor).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {p.observacoes && (
                                                <div className="bg-amber-50/80 rounded-[1.5rem] p-5 border-l-4 border-amber-400">
                                                    <p className="text-[9px] font-black text-amber-600 uppercase mb-2 tracking-widest">Observações Importantes</p>
                                                    <p className="text-sm italic text-amber-900 leading-relaxed font-bold">"{p.observacoes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RODAPÉ DE AÇÕES */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-4 mt-auto">
                                    <div className="flex flex-col sm:flex-row gap-3 w-full bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                                         <Button
                                            variant="ghost"
                                            className={`flex-1 rounded-xl font-black uppercase text-[10px] h-12 transition-all ${p.status === 'realizados' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'text-slate-400 hover:bg-slate-50'}`}
                                            onClick={() => updateStatus(p.id, 'realizados')}
                                         >
                                            Realizado
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className={`flex-1 rounded-xl font-black uppercase text-[10px] h-12 transition-all ${p.status === 'em_producao' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                                            onClick={() => updateStatus(p.id, 'em_producao')}
                                        >
                                            Em Produção
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className={`flex-1 rounded-xl font-black uppercase text-[10px] h-12 transition-all ${p.status === 'finalizados' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'text-slate-400 hover:bg-slate-50'}`}
                                            onClick={() => updateStatus(p.id, 'finalizados')}
                                        >
                                            Finalizado
                                        </Button>
                                    </div>

                                    <div className="flex justify-between items-center w-full pt-2">
                                        <Button
                                            variant="ghost"
                                            className="text-red-400 hover:bg-red-50 hover:text-red-600 font-black uppercase tracking-widest text-[10px] rounded-xl"
                                            onClick={() => handleExcluirPedido(p.id, p.foto_url)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Excluir Pedido
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-[#06B6D4] hover:border-cyan-200 rounded-xl"
                                            onClick={() => navigate(`/pedidos/editar/${p.id}`)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" /> Editar Ficha
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}