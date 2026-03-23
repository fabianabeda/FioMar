import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    Users,
    Clock,
    Plus,
    LogOut,
    ThumbsUp,
    CheckCheck,
    DollarSign,
    ArrowDownCircle,
    PieChart,
    Palette,
    Calendar,
    Store
} from "lucide-react";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

import logoImg from "@/assets/logo-fabbis.jpeg";

interface DashboardStats {
    total: number;
    pendente: number;
    em_producao: number;
    concluido: number;
    totalClientes: number;
    faturamentoMes: number;
    despesasTotais: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        total: 0,
        pendente: 0,
        em_producao: 0,
        concluido: 0,
        totalClientes: 0,
        faturamentoMes: 0,
        despesasTotais: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
        } else {
          await loadStats();
        }
      };
      checkUser();
    }, [navigate]);

    const loadStats = async () => {
        try {
            const [pedidosRes, clientesRes, gastosRes] = await Promise.all([
                supabase.from("pedidos").select("status, valor, data_entrega"),
                supabase.from("clientes").select("id", { count: "exact", head: true }),
                supabase.from("gastos").select("valor, data_gasto")
            ]);

            if (pedidosRes.error) throw pedidosRes.error;
            if (clientesRes.error) throw clientesRes.error;
            if (gastosRes.error) throw gastosRes.error;

            const pedidos = pedidosRes.data || [];
            const gastos = gastosRes.data || [];

            const hoje = new Date();
            const mesAtual = hoje.getMonth();
            const anoAtual = hoje.getFullYear();

            const newStats = {
                total: pedidos.length,
                // AQUI ESTÁ A CORREÇÃO: O sistema agora conta "realizados" e "finalizados"
                pendente: pedidos.filter(p => p.status === "realizados").length,
                em_producao: pedidos.filter(p => p.status === "em_producao").length,
                concluido: pedidos.filter(p => p.status === "finalizados").length,
                totalClientes: clientesRes.count || 0,
                faturamentoMes: 0,
                despesasTotais: 0,
            };

            pedidos.forEach(p => {
                if (!p.data_entrega) return;
                const dataEntrega = new Date(p.data_entrega);
                dataEntrega.setMinutes(dataEntrega.getMinutes() + dataEntrega.getTimezoneOffset());
                if (dataEntrega.getMonth() === mesAtual && dataEntrega.getFullYear() === anoAtual && p.status !== 'cancelado') {
                    newStats.faturamentoMes += Number(p.valor) || 0;
                }
            });

            gastos.forEach(g => {
                if (!g.data_gasto) return;
                const dataGasto = new Date(g.data_gasto);
                dataGasto.setMinutes(dataGasto.getMinutes() + dataGasto.getTimezoneOffset());
                if (dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual) {
                    newStats.despesasTotais += Number(g.valor) || 0;
                }
            });

            setStats(newStats);
        } catch (error) {
            const pgError = error as PostgrestError;
            toast.error(pgError.message || "Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.log("Erro ao deslogar...");
      } finally {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/auth";
      }
    };

    const formatarDinheiro = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-black text-[#06B6D4] uppercase tracking-widest">Carregando painel Fabbis...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');
                  .font-allura { font-family: 'Allura', cursive; }
                  .font-montserrat { font-family: 'Montserrat', sans-serif; }
                `}
            </style>

            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logoImg} alt="Logomarca Fabbis" className="h-12 w-auto object-contain rounded-lg" />
                        <p className="text-3xl text-[#06B6D4] font-allura hidden md:block mt-1">Gestão Fabbis</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-[#06B6D4] font-bold uppercase text-[10px] tracking-widest">
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8 text-center md:text-left">
                    <h2 className="text-5xl md:text-6xl text-[#06B6D4] font-allura mb-1">Painel de Controle</h2>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] ml-1 font-montserrat">
                        Acompanhe seus pedidos e a saúde financeira do mês
                    </p>
                </div>

                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-10">
                    <Card onClick={() => navigate('/pedidos')} className="p-6 bg-white border-none shadow-sm hover:shadow-lg transition-all cursor-pointer rounded-[2rem]">
                        <div className="flex items-center justify-between mb-4"><Package className="h-6 w-6 text-slate-400" /><Badge variant="secondary" className="bg-slate-50">{stats.total}</Badge></div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-montserrat">Total Geral</h3>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.total}</p>
                    </Card>

                    {/* CORREÇÃO NOS LINKS DE NAVEGAÇÃO DOS CARDS */}
                    <Card onClick={() => navigate('/pedidos?status=realizados')} className="p-6 bg-white border-none shadow-sm hover:shadow-lg transition-all cursor-pointer rounded-[2rem] border-b-4 border-amber-400">
                        <div className="flex items-center justify-between mb-4"><ThumbsUp className="h-6 w-6 text-amber-500" /><Badge className="bg-amber-100 text-amber-700">{stats.pendente}</Badge></div>
                        <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 font-montserrat">Realizados</h3>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.pendente}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=em_producao')} className="p-6 bg-white border-none shadow-sm hover:shadow-lg transition-all cursor-pointer rounded-[2rem] border-b-4 border-[#06B6D4]">
                        <div className="flex items-center justify-between mb-4"><Clock className="h-6 w-6 text-[#06B6D4]" /><Badge className="bg-cyan-100 text-[#06B6D4]">{stats.em_producao}</Badge></div>
                        <h3 className="text-[9px] font-black text-[#06B6D4] uppercase tracking-widest mb-1 font-montserrat">Em Produção</h3>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.em_producao}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=finalizados')} className="p-6 bg-white border-none shadow-sm hover:shadow-lg transition-all cursor-pointer rounded-[2rem] border-b-4 border-emerald-500">
                        <div className="flex items-center justify-between mb-4"><CheckCheck className="h-6 w-6 text-emerald-500" /><Badge className="bg-emerald-100 text-emerald-700">{stats.concluido}</Badge></div>
                        <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 font-montserrat">Finalizados</h3>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats.concluido}</p>
                    </Card>
                </div>

                <Card className="p-8 mb-10 border-none shadow-sm rounded-[2.5rem] bg-white">
                    <h3 className="text-4xl text-[#06B6D4] font-allura mb-6">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button className="w-full justify-start h-16 rounded-2xl bg-[#06B6D4] hover:bg-[#0891B2] text-white font-black shadow-lg shadow-cyan-100 transition-all active:scale-95" onClick={() => navigate("/pedidos/novo")}>
                            <Plus className="h-5 w-5 mr-3" /> NOVO PEDIDO
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-16 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white font-bold text-slate-600" onClick={() => navigate("/clientes")}>
                            <Users className="h-5 w-5 mr-3 text-pink-500" /> GERENCIAR CLIENTES
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-16 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white font-bold text-slate-600" onClick={() => navigate("/materiais")}>
                            <Palette className="h-5 w-5 mr-3 text-purple-500" /> MEUS MATERIAIS
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-16 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white font-bold text-slate-600" onClick={() => navigate('/agenda')}>
                            <Calendar className="h-5 w-5 mr-3 text-orange-500" /> AGENDA DE ENTREGAS
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-16 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white font-bold text-slate-600" onClick={() => navigate('/financeiro')}>
                            <DollarSign className="h-5 w-5 mr-3 text-emerald-500" /> MEU CAIXA
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-16 rounded-2xl border-slate-100 bg-slate-50 hover:bg-white font-bold text-slate-600" onClick={() => navigate('/catalogo')}>
                            <Store className="h-5 w-5 mr-3 text-indigo-500" /> VITRINE
                        </Button>
                    </div>
                </Card>

                <h3 className="text-4xl text-[#06B6D4] font-allura mb-6">Resumo Financeiro do Mês</h3>
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="p-6 bg-emerald-50/50 border-none shadow-sm rounded-[2rem] flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><DollarSign className="h-5 w-5" /></div>
                            <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest font-montserrat">Faturamento Estimado</h3>
                        </div>
                        <p className="text-3xl font-black text-emerald-800 tracking-tighter">{formatarDinheiro(stats.faturamentoMes)}</p>
                    </Card>

                    <Card className="p-6 bg-rose-50/50 border-none shadow-sm rounded-[2rem] flex flex-col justify-center gap-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center text-white"><ArrowDownCircle className="h-5 w-5" /></div>
                            <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-widest font-montserrat">Despesas Registradas</h3>
                        </div>
                        <p className="text-3xl font-black text-rose-800 tracking-tighter">{formatarDinheiro(stats.despesasTotais)}</p>
                    </Card>

                    <Card className="p-6 bg-blue-50/50 border-none shadow-sm rounded-[2rem] flex flex-col justify-center gap-2">
                         <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white"><PieChart className="h-5 w-5" /></div>
                            <h3 className="text-[10px] font-black text-blue-800 uppercase tracking-widest font-montserrat">Lucro Líquido</h3>
                        </div>
                        <p className="text-3xl font-black text-blue-900 tracking-tighter">{formatarDinheiro(stats.faturamentoMes - stats.despesasTotais)}</p>
                    </Card>
                </div>
            </main>
        </div>
    );
}