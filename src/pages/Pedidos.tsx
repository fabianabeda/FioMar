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
    ArrowLeft, Plus, Search, Edit, Package, Clock, Eye, MessageCircle, AlertTriangle, RotateCcw, Send, CheckCircle2
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

const statusConfig: Record<string, { label: string; color: string }> = {
    pendente: { label: "Pendente", color: "bg-amber-500" },
    em_producao: { label: "Em Produção", color: "bg-blue-500" },
    concluido: { label: "Concluído", color: "bg-green-600" },
    entregue: { label: "Entregue", color: "bg-slate-800" },
    cancelado: { label: "Cancelado", color: "bg-red-600" },
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

    // MELHORIA 2: MENSAGEM PERSONALIZADA DE WHATSAPP
    const handleWhatsAppNotificacao = (p: Pedido) => {
        const cleanPhone = p.clientes?.telefone?.replace(/\D/g, "");
        const nomeCliente = p.clientes?.nome_completo.split(' ')[0];

        let mensagem = "";

        if (p.status === 'concluido') {
            mensagem = `Olá, ${nomeCliente}! ✨%0A%0ASeu pedido de *${p.produto}* da *Fabbis* já está prontinho! 👙%0A%0A*Valor:* R$ ${Number(p.valor).toFixed(2)}%0A%0AComo você prefere retirar?`;
        } else {
            mensagem = `Olá, ${nomeCliente}! ✨%0A%0AEstou passando para confirmar seu pedido de *${p.produto}* na *Fabbis*. Ele está com entrega prevista para o dia *${format(parseISO(p.data_entrega), "dd/MM/yyyy")}*! 👙`;
        }

        window.open(`https://wa.me/55${cleanPhone}?text=${mensagem}`, "_blank");
    };

    // MELHORIA 1: LÓGICA DE CORES PARA PRAZO
    const getEstiloPrazo = (dataStr: string, status: string) => {
        if (status === 'entregue' || status === 'cancelado') return "text-slate-400";

        const hoje = new Date();
        const dataEntrega = parseISO(dataStr);

        if (isBefore(dataEntrega, hoje) && !isSameDay(dataEntrega, hoje)) {
            return "text-red-600 font-black animate-pulse flex items-center gap-1"; // ATRASADO
        }
        if (isSameDay(dataEntrega, hoje)) {
            return "text-amber-600 font-black flex items-center gap-1"; // ENTREGA HOJE
        }
        return "text-slate-500";
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase.from("pedidos").update({ status: newStatus }).eq("id", id);
        if (!error) {
            toast.success(`Status atualizado!`);
            setModalAberto(false);
            loadPedidos();
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Carregando...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            <header className="border-b bg-white sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-14 w-auto cursor-pointer" onClick={() => navigate("/")} />
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 mr-1" /> Painel</Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg" onClick={() => navigate("/pedidos/novo")}><Plus className="h-4 w-4 mr-1" /> Novo Pedido</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-5xl">
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 h-11 rounded-xl border border-slate-200 bg-white px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Select value={currentStatus} onValueChange={(val) => setSearchParams({ status: val })}>
                        <SelectTrigger className="w-full md:w-[200px] h-11 rounded-xl border-slate-200 font-medium bg-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Pedidos</SelectItem>
                            {Object.keys(statusConfig).map(k => <SelectItem key={k} value={k}>{statusConfig[k].label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-3">
                    {filteredPedidos.length > 0 ? (
                        filteredPedidos.map((pedido) => {
                            const config = statusConfig[pedido.status] || statusConfig.pendente;
                            const estiloPrazo = getEstiloPrazo(pedido.data_entrega, pedido.status);

                            return (
                                <Card
                                    key={pedido.id}
                                    onClick={() => { setPedidoSelecionado(pedido); setModalAberto(true); }}
                                    className="p-4 cursor-pointer hover:border-blue-300 transition-all rounded-2xl border-slate-200 shadow-sm bg-white"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-slate-50 rounded-xl overflow-hidden border flex-shrink-0">
                                            {pedido.foto_url ? <img src={pedido.foto_url} className="h-full w-full object-cover" /> : <Package className="h-full w-full p-4 text-slate-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 truncate">{pedido.clientes?.nome_completo}</h3>
                                                <Badge className={`${config.color} text-[10px] text-white py-0 h-5 border-none`}>{config.label}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{pedido.produto} • Tam {pedido.tamanho}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900 text-lg">R$ {Number(pedido.valor).toFixed(2)}</p>
                                            <p className={`text-[10px] font-bold flex items-center justify-end gap-1 uppercase ${estiloPrazo}`}>
                                                <Clock className="h-3 w-3" />
                                                {format(parseISO(pedido.data_entrega), "dd/MM/yyyy")}
                                                {estiloPrazo.includes('red') && " ⚠️"}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })
                    ) : (
                        <div className="text-center py-20 text-slate-500 font-bold">Nenhum pedido encontrado.</div>
                    )}
                </div>
            </main>

            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="max-w-4xl p-0 border-none bg-white rounded-2xl overflow-hidden shadow-2xl">
                    {pedidoSelecionado && (() => {
                        const p = pedidoSelecionado;
                        const config = statusConfig[p.status] || statusConfig.pendente;

                        return (
                            <div className="flex flex-col max-h-[90vh] overflow-y-auto">
                                <div className="bg-[#3B82F6] p-6 text-white relative">
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-1">Ficha de Produção</p>
                                    <DialogTitle className="text-3xl font-black">{p.clientes?.nome_completo}</DialogTitle>
                                    <Badge className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white border-none font-bold">
                                        {config.label}
                                    </Badge>
                                </div>

                                <div className="p-6 space-y-6 bg-white">
                                    <Button
                                        className={`w-full ${p.status === 'concluido' ? 'bg-green-600' : 'bg-[#22C55E]'} hover:opacity-90 text-white font-black text-sm h-14 rounded-xl shadow-sm uppercase tracking-wider`}
                                        onClick={() => handleWhatsAppNotificacao(p)}
                                    >
                                        <MessageCircle className="h-5 w-5 mr-2 fill-current" />
                                        {p.status === 'concluido' ? 'NOTIFICAR QUE ESTÁ PRONTO' : 'ENVIAR STATUS WHATSAPP'}
                                    </Button>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="border border-slate-100 bg-slate-50/50 p-5 rounded-xl">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-4">
                                                    <Package className="h-4 w-4" /> Dados do Produto
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-700 font-medium">Tipo:</span>
                                                        <span className="text-[#06B6D4] font-black text-lg capitalize">{p.produto}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-700 font-medium">Tamanho:</span>
                                                        <span className="text-[#06B6D4] font-black text-lg">{p.tamanho}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border border-blue-100 bg-[#F8FAFC] p-5 rounded-xl">
                                                <h4 className="text-[11px] font-black text-blue-600 uppercase mb-3">Parte de Cima (Top)</h4>
                                                <div className="space-y-2 text-sm text-slate-800">
                                                    <p><strong className="font-bold">Modelo:</strong> {p.modelo_cima}</p>
                                                    <p className="flex items-center gap-2">
                                                        <strong className="font-bold">Bojo?</strong>
                                                        <span className="border border-slate-200 bg-white rounded-full px-3 py-0.5 text-xs font-semibold text-slate-700">
                                                            {p.tem_bojo ? "Sim" : "Não"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="border border-purple-100 bg-[#FAF5FF] p-5 rounded-xl">
                                                <h4 className="text-[11px] font-black text-purple-600 uppercase mb-3">Parte de Baixo (Calcinha)</h4>
                                                <div className="space-y-2 text-sm text-slate-800">
                                                    <p><strong className="font-bold">Modelo:</strong> {p.modelo_baixo}</p>
                                                    <p><strong className="font-bold">Lateral:</strong> {p.tipo_lateral_baixo}</p>
                                                </div>
                                            </div>

                                            <div className="border border-pink-100 bg-[#FFF1F2] p-5 rounded-xl">
                                                <h4 className="text-[11px] font-black text-pink-600 uppercase mb-3">Cores e Detalhes</h4>
                                                <div className="space-y-2 text-sm text-slate-800">
                                                    <p><strong className="font-bold">Cor Frente:</strong> {p.cor_frente}</p>
                                                    <p><strong className="font-bold">Cor Verso:</strong> {p.cor_verso}</p>
                                                    <p><strong className="font-bold">Roletes:</strong> {p.cor_roletes || "-"}</p>
                                                    <p><strong className="font-bold">Linha Crochê:</strong> {p.cor_linha || "-"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 text-center lg:text-right">
                                            <div className="flex justify-center lg:justify-end">
                                                <div className="bg-slate-50 rounded-2xl w-[220px] h-[220px] border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                                                    {p.foto_url ? (
                                                        <img src={p.foto_url} alt="Referência" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                                            <Package className="h-10 w-10 mb-2" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Sem Foto</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border border-orange-200 bg-[#FFF7ED] p-5 rounded-xl mt-4 text-left">
                                                <h4 className="text-[11px] font-black text-orange-600 uppercase mb-4 text-center lg:text-left">Entrega e Financeiro</h4>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] font-black text-orange-600/70 uppercase mb-1">Prazo</p>
                                                        <p className={`text-xl font-bold ${getEstiloPrazo(p.data_entrega, p.status)}`}>
                                                            {format(parseISO(p.data_entrega), "dd/MM/yyyy")}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-orange-600/70 uppercase mb-1">Valor Total</p>
                                                        <p className="text-3xl font-black text-orange-600">
                                                            <span className="text-xl mr-1">R$</span>{Number(p.valor).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {p.observacoes && (
                                                <div className="bg-[#FEFCE8] border-l-4 border-yellow-400 p-5 rounded-r-xl mt-4 text-left">
                                                    <h4 className="text-[11px] font-black text-yellow-800 uppercase flex items-center gap-2 mb-2">
                                                        <AlertTriangle className="h-4 w-4" /> Notas
                                                    </h4>
                                                    <p className="text-sm italic text-yellow-900">"{p.observacoes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
                                    <Button
                                        variant="ghost"
                                        className="text-slate-500 font-bold uppercase tracking-wider text-xs"
                                        onClick={() => navigate(`/pedidos/editar/${p.id}`)}
                                    >
                                        <Edit className="h-4 w-4 mr-2" /> Editar
                                    </Button>

                                    <div className="flex gap-3 w-full sm:w-auto">
                                        {p.status !== 'pendente' && (
                                            <Button variant="outline" className="border-amber-200 text-amber-600 font-bold uppercase text-xs" onClick={() => updateStatus(p.id, 'pendente')}>
                                                <RotateCcw className="h-4 w-4 mr-1" /> Reabrir
                                            </Button>
                                        )}
                                        {p.status === 'pendente' && (
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs h-12 px-8 rounded-xl" onClick={() => updateStatus(p.id, 'em_producao')}>
                                                Iniciar
                                            </Button>
                                        )}
                                        {p.status !== 'concluido' && (
                                            <Button className="bg-[#16A34A] hover:bg-[#15803D] text-white font-bold uppercase text-xs h-12 px-8 rounded-xl" onClick={() => updateStatus(p.id, 'concluido')}>
                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                                            </Button>
                                        )}
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