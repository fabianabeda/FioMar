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
    AlertTriangle,
    Plus,
    Sparkles
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

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-cyan-600 uppercase tracking-widest text-sm">Organizando Agulhas...</div>;

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg cursor-pointer" onClick={() => navigate("/")} />
                    <Button variant="ghost" size="sm" className="font-bold text-slate-400" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Painel
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* TÍTULO ESTILIZADO */}
                <div className="text-center md:text-left mb-10">
                    <h1 className="leading-tight flex flex-col md:flex-row md:items-baseline">
                        <span className="text-7xl md:text-8xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Minha</span>
                        <span className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-[0.2em] ml-0 md:ml-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Agenda</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* CALENDÁRIO (MAIOR) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="p-8 rounded-[3rem] border-none shadow-md bg-white">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tighter">
                                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                                </h2>
                                <div className="flex gap-3">
                                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-2xl bg-slate-50 hover:bg-cyan-50 hover:text-cyan-600">
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-2xl bg-slate-50 hover:bg-cyan-50 hover:text-cyan-600">
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-4 mb-4">
                                {diasDaSemana.map(dia => (
                                    <div key={dia} className="text-center font-black text-slate-300 text-[10px] uppercase tracking-[0.2em]">
                                        {dia}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-3">
                                {diasDoCalendario.map((dia, i) => {
                                    const pedidosNesteDia = getPedidosPorDia(dia);
                                    const isSelected = isSameDay(dia, selectedDate);
                                    const isCurrentMonth = isSameMonth(dia, currentMonth);
                                    const today = isToday(dia);
                                    const temAtrasado = pedidosNesteDia.some(p =>
                                        p.status !== 'concluido' &&
                                        p.status !== 'entregue' &&
                                        isBefore(parseISO(p.data_entrega), new Date()) &&
                                        !isToday(parseISO(p.data_entrega))
                                    );

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedDate(dia)}
                                            className={`
                                                min-h-[100px] p-2 rounded-[1.5rem] border-2 transition-all cursor-pointer flex flex-col items-center group relative
                                                ${!isCurrentMonth ? 'opacity-20 border-transparent pointer-events-none' : 'hover:border-cyan-100 hover:bg-cyan-50/20'}
                                                ${isSelected ? 'border-cyan-500 bg-cyan-50/50 shadow-lg shadow-cyan-100/50' : 'border-slate-50'}
                                                ${today && !isSelected ? 'border-amber-200 bg-amber-50/50' : ''}
                                                ${temAtrasado && isCurrentMonth ? 'bg-rose-50/30' : ''}
                                            `}
                                        >
                                            <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl mb-2
                                                ${today ? 'bg-amber-500 text-white shadow-md' : isSelected ? 'bg-cyan-600 text-white' : 'text-slate-500 group-hover:text-cyan-600'}
                                            `}>
                                                {format(dia, "d")}
                                            </span>

                                            <div className="flex flex-wrap gap-1 justify-center mt-auto w-full px-1 mb-2">
                                                {pedidosNesteDia.slice(0, 4).map(p => (
                                                    <div key={p.id} className={`w-2 h-2 rounded-full ${statusConfig[p.status]?.dot || 'bg-slate-300 shadow-sm'}`} />
                                                ))}
                                                {pedidosNesteDia.length > 4 && <span className="text-[8px] font-black text-slate-400">+{pedidosNesteDia.length - 4}</span>}
                                            </div>

                                            {temAtrasado && (
                                                <div className="absolute top-2 right-2">
                                                    <AlertTriangle className="h-3 w-3 text-rose-500 animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </Card>

                        <Card className="p-6 rounded-[2rem] border-none shadow-sm bg-white/50">
                            <div className="flex flex-wrap gap-6 justify-center">
                                {Object.keys(statusConfig).map(k => (
                                    <div key={k} className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${statusConfig[k].dot}`} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{statusConfig[k].label}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* FILA LATERAL (MENOR) */}
                    <div className="lg:col-span-4">
                        <Card className="p-8 rounded-[3rem] border-none shadow-xl bg-white sticky top-24 h-fit flex flex-col min-h-[500px]">
                            <div className="mb-8 border-b border-slate-50 pb-6 relative">
                                <div className="absolute -top-2 -right-2">
                                    <Sparkles className="h-5 w-5 text-cyan-200" />
                                </div>
                                <h3 className="font-black text-slate-300 text-[10px] uppercase tracking-[0.2em] mb-2">Pedidos para</h3>
                                <p className="text-3xl font-black text-slate-800 tracking-tighter">
                                    {isToday(selectedDate) ? "Hoje" : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                                </p>
                            </div>

                            <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                {pedidosDoDia.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                                        <CalendarIcon className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                                        <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Agenda Livre</p>
                                    </div>
                                ) : (
                                    pedidosDoDia.map(pedido => {
                                        const conf = statusConfig[pedido.status] || statusConfig.pendente;
                                        return (
                                            <div
                                                key={pedido.id}
                                                className="p-5 rounded-[2rem] border-2 border-slate-50 bg-white hover:border-cyan-200 transition-all cursor-pointer group"
                                                onClick={() => navigate(`/pedidos`)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{pedido.clientes?.nome_completo}</h4>
                                                    <div className={`p-1.5 rounded-lg ${conf.color.replace('text', 'bg').replace('800', '500')} text-white`}>
                                                        <conf.icon className="h-3 w-3" />
                                                    </div>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-400 mb-4">{pedido.produto}</p>
                                                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                                    <Badge className={`${conf.color} border-none text-[8px] uppercase font-black px-2 py-0.5 rounded-full`}>
                                                        {conf.label}
                                                    </Badge>
                                                    <span className="font-black text-cyan-600 text-xs tracking-tighter">R$ {Number(pedido.valor).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            <Button
                                className="w-full mt-8 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest h-16 shadow-lg shadow-slate-100 transition-all active:scale-95"
                                onClick={() => navigate('/pedidos/novo')}
                            >
                                <Plus className="h-5 w-5 mr-3" /> Agendar Entrega
                            </Button>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}