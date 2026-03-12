import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    CheckCircle2,
    AlertCircle,
    Package,
    AlertTriangle
} from "lucide-react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isSameDay,
    startOfWeek,
    endOfWeek,
    parseISO,
    isBefore
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

interface Pedido {
    id: string;
    clientes: { nome_completo: string };
    produto: string;
    data_entrega: string;
    status: string;
    valor: number;
}

const statusConfig: Record<string, { label: string; color: string; dot: string; icon: any }> = {
    pendente: { label: "Pendente", color: "bg-amber-100 text-amber-800", dot: "bg-amber-500", icon: AlertCircle },
    em_producao: { label: "Em Produção", color: "bg-blue-100 text-blue-800", dot: "bg-blue-500", icon: Clock },
    concluido: { label: "Concluído", color: "bg-green-100 text-green-800", dot: "bg-green-500", icon: CheckCircle2 },
    entregue: { label: "Entregue", color: "bg-slate-100 text-slate-800", dot: "bg-slate-800", icon: Package },
};

export default function Agenda() {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        loadPedidos();
    }, [currentMonth]);

    const loadPedidos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("pedidos")
                .select("id, produto, data_entrega, status, valor, clientes(nome_completo)")
                .neq("status", "cancelado");

            if (error) throw error;
            setPedidos(data || []);
        } catch (error) {
            toast.error("Erro ao carregar a agenda.");
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const diasDoCalendario = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const pedidosDoDia = useMemo(() => {
        return pedidos.filter(p => p.data_entrega && isSameDay(parseISO(p.data_entrega), selectedDate));
    }, [pedidos, selectedDate]);

    const getPedidosPorDia = (date: Date) => {
        return pedidos.filter(p => p.data_entrega && isSameDay(parseISO(p.data_entrega), date));
    };

    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Agenda de Produção</h1>
                        <p className="text-slate-500 text-sm mt-1">Organize suas costuras e entregas por data</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CALENDÁRIO */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-cyan-900 capitalize">
                                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                                </h2>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-full border-slate-200">
                                        <ChevronLeft className="h-5 w-5 text-slate-600" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-full border-slate-200">
                                        <ChevronRight className="h-5 w-5 text-slate-600" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {diasDaSemana.map(dia => (
                                    <div key={dia} className="text-center font-bold text-slate-400 text-xs uppercase tracking-wider py-2">
                                        {dia}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {diasDoCalendario.map((dia, i) => {
                                    const pedidosNesteDia = getPedidosPorDia(dia);
                                    const isSelected = isSameDay(dia, selectedDate);
                                    const isCurrentMonth = isSameMonth(dia, currentMonth);
                                    const today = isToday(dia);
                                    const temAtrasado = pedidosNesteDia.some(p => p.status !== 'concluido' && p.status !== 'entregue' && isBefore(parseISO(p.data_entrega), new Date()) && !isToday(parseISO(p.data_entrega)));

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedDate(dia)}
                                            className={`
                                                min-h-[85px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-start relative
                                                ${!isCurrentMonth ? 'opacity-30 bg-slate-50/50' : 'bg-white hover:border-cyan-300'}
                                                ${isSelected ? 'border-cyan-500 shadow-md ring-2 ring-cyan-100' : 'border-slate-100'}
                                                ${today && !isSelected ? 'border-amber-400 bg-amber-50/30' : ''}
                                                ${temAtrasado && isCurrentMonth ? 'bg-red-50/20 border-red-200' : ''}
                                            `}
                                        >
                                            <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-1
                                                ${today ? 'bg-amber-500 text-white' : isSelected ? 'bg-cyan-600 text-white' : 'text-slate-700'}
                                            `}>
                                                {format(dia, "d")}
                                            </span>

                                            <div className="flex flex-wrap gap-1 justify-center mt-auto w-full px-1 mb-1">
                                                {pedidosNesteDia.map(p => (
                                                    <div key={p.id} className={`w-2 h-2 rounded-full ${statusConfig[p.status]?.dot || 'bg-slate-300'}`} />
                                                ))}
                                            </div>
                                            {temAtrasado && <AlertTriangle className="h-3 w-3 text-red-500 absolute top-1 right-1" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start px-2">
                            {Object.keys(statusConfig).map(k => (
                                <div key={k} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[k].dot}`} /> {statusConfig[k].label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LISTA LATERAL DO DIA */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white h-full flex flex-col min-h-[400px]">
                            <div className="mb-6 border-b border-slate-100 pb-4">
                                <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-1">Fila de Entrega</h3>
                                <p className="text-xl font-black text-cyan-600 capitalize">
                                    {isToday(selectedDate) ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                                </p>
                            </div>

                            <div className="flex-grow space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {pedidosDoDia.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CalendarIcon className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-bold text-sm">Nenhum pedido marcado.</p>
                                    </div>
                                ) : (
                                    pedidosDoDia.map(pedido => {
                                        const conf = statusConfig[pedido.status] || statusConfig.pendente;
                                        return (
                                            <div
                                                key={pedido.id}
                                                className="p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-cyan-100 transition-all cursor-pointer"
                                                onClick={() => navigate(`/pedidos`)}
                                            >
                                                <h4 className="font-black text-slate-900 text-sm mb-1 truncate">{pedido.clientes?.nome_completo}</h4>
                                                <p className="text-xs font-bold text-slate-500 mb-3">{pedido.produto}</p>
                                                <div className="flex justify-between items-center">
                                                    <Badge className={`${conf.color} border-none text-[9px] uppercase font-black px-2 py-0`}>
                                                        {conf.label}
                                                    </Badge>
                                                    <span className="font-black text-slate-900 text-xs">R$ {Number(pedido.valor).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            <Button
                                className="w-full mt-6 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase h-12"
                                onClick={() => navigate('/pedidos/novo')}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Agendar Novo
                            </Button>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Pequeno ajuste para Lucide Plus que faltou no import inicial
import { Plus } from "lucide-react";