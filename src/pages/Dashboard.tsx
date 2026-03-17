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
    Truck,
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
    entregue: number;
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
        entregue: 0,
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
          await loadStats(); // Carrega os dados reais assim que confirmar a sessão
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
                pendente: pedidos.filter(p => p.status === "pendente").length,
                em_producao: pedidos.filter(p => p.status === "em_producao").length,
                concluido: pedidos.filter(p => p.status === "concluido").length,
                entregue: pedidos.filter(p => p.status === "entregue").length,
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
        return <div className="min-h-screen flex items-center justify-center font-medium text-cyan-600">Carregando painel Fabbis...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-12">
            {/* Importando a fonte Allura */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&display=swap');
                  .font-allura { font-family: 'Allura', cursive; }
                `}
            </style>

            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logoImg} alt="Logomarca Fabbis" className="h-16 w-auto object-contain rounded-lg" />
                        <p className="text-3xl text-[#06B6D4] font-allura hidden md:block mt-2">Gestão Fabbis</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-cyan-600 font-bold">
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    {/* Título com Allura e Ciano */}
                    <h2 className="text-5xl text-[#06B6D4] font-allura mb-1">Painel de Controle</h2>
                    <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] ml-1">
                        Acompanhe seus pedidos e a saúde financeira do mês
                    </p>
                </div>

                {/* --- SEÇÃO 1: STATUS DOS PEDIDOS --- */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
                    <Card onClick={() => navigate('/pedidos')} className="p-6 bg-white border-slate-100 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                        <div className="flex items-center justify-between mb-4"><Package className="h-8 w-8 text-slate-400" /><Badge variant="secondary" className="bg-slate-50">{stats.total}</Badge></div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Geral</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.total}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=pendente')} className="p-6 bg-white border-slate-100 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                        <div className="flex items-center justify-between mb-4"><ThumbsUp className="h-8 w-8 text-amber-400" /><Badge className="bg-amber-100 text-amber-700">{stats.pendente}</Badge></div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Novos Pedidos</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.pendente}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=em_producao')} className="p-6 bg-white border-slate-100 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                        <div className="flex items-center justify-between mb-4"><Clock className="h-8 w-8 text-[#06B6D4]" /><Badge className="bg-cyan-100 text-[#06B6D4]">{stats.em_producao}</Badge></div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Em Produção</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.em_producao}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=concluido')} className="p-6 bg-white border-slate-100 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                        <div className="flex items-center justify-between mb-4"><CheckCheck className="h-8 w-8 text-emerald-500" /><Badge className="bg-emerald-100 text-emerald-700">{stats.concluido}</Badge></div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Concluídos</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.concluido}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=entregue')} className="p-6 bg-white border-slate-100 hover:shadow-lg transition-shadow cursor-pointer rounded-2xl">
                        <div className="flex items-center justify-between mb-4"><Truck className="h-8 w-8 text-indigo-400" /><Badge className="bg-indigo-100 text-indigo-700">{stats.entregue}</Badge></div>
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entregues</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.entregue}</p>
                    </Card>
                </div>

                {/* --- SEÇÃO 2: AÇÕES RÁPIDAS --- */}
                <Card className="p-8 mb-8 border-none shadow-sm rounded-3xl">
                    <h3 className="text-3xl text-[#06B6D4] font-allura mb-6">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button className="w-full justify-start h-14 rounded-xl bg-[#06B6D4] hover:bg-[#0891B2] font-bold" onClick={() => navigate("/pedidos/novo")}>
                            <Plus className="h-5 w-5 mr-3" /> Novo Pedido
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-14 rounded-xl border-slate-100 bg-slate-50 hover:bg-white font-semibold" onClick={() => navigate("/clientes")}>
                            <Users className="h-5 w-5 mr-3 text-pink-500" /> Gerenciar Clientes
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-14 rounded-xl border-slate-100 bg-slate-50 hover:bg-white font-semibold" onClick={() => navigate("/materiais")}>
                            <Palette className="h-5 w-5 mr-3 text-purple-500" /> Meus Materiais
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-14 rounded-xl border-slate-100 bg-slate-50 hover:bg-white font-semibold" onClick={() => navigate('/agenda')}>
                            <Calendar className="h-5 w-5 mr-3 text-orange-500" /> Agenda de Entregas
                        </Button>
                        <Button variant="outline" className="h-14 rounded-xl border-slate-100 bg-slate-50 hover:bg-white font-semibold flex justify-start px-4" onClick={() => navigate('/financeiro')}>
                            <DollarSign className="h-5 w-5 mr-3 text-emerald-500" /> Meu Caixa
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-14 rounded-xl border-slate-100 bg-slate-50 hover:bg-white font-semibold" onClick={() => navigate('/catalogo')}>
                            <Store className="h-5 w-5 mr-3 text-indigo-500" /> Vitrine de Biquínis
                        </Button>
                    </div>
                </Card>

                {/* --- SEÇÃO 3: FINANCEIRO --- */}
                <h3 className="text-3xl text-[#06B6D4] font-allura mb-6">Resumo Financeiro do Mês</h3>
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="p-8 bg-[#E7F9F0] border-none shadow-sm rounded-2xl flex items-center gap-6">
                        <div className="h-14 w-14 rounded-full bg-[#22C55E] flex items-center justify-center text-white"><DollarSign className="h-8 w-8" /></div>
                        <div>
                            <h3 className="text-[10px] font-bold text-[#15803D] uppercase tracking-widest mb-1">Faturamento Estimado</h3>
                            <p className="text-3xl font-black text-[#166534] tracking-tighter">{formatarDinheiro(stats.faturamentoMes)}</p>
                        </div>
                    </Card>

                    <Card className="p-8 bg-[#FFF1F2] border-none shadow-sm rounded-2xl flex items-center gap-6">
                        <div className="h-14 w-14 rounded-full bg-[#F43F5E] flex items-center justify-center text-white"><ArrowDownCircle className="h-6 w-6" /></div>
                        <div>
                            <h3 className="text-[10px] font-bold text-[#BE123C] uppercase tracking-widest mb-1">Despesas Registradas</h3>
                            <p className="text-3xl font-black text-[#9F1239] tracking-tighter">{formatarDinheiro(stats.despesasTotais)}</p>
                        </div>
                    </Card>

                    <Card className="p-8 bg-[#EFF6FF] border-none shadow-sm rounded-2xl flex items-center gap-6">
                        <div className="h-14 w-14 rounded-full bg-[#3B82F6] flex items-center justify-center text-white"><PieChart className="h-6 w-6" /></div>
                        <div>
                            <h3 className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-widest mb-1">Lucro Líquido Real</h3>
                            <p className="text-3xl font-black text-[#1E40AF] tracking-tighter">{formatarDinheiro(stats.faturamentoMes - stats.despesasTotais)}</p>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}