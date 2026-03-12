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
            }
        };
        checkUser();
    }, [navigate]);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate("/auth");
    };

    const loadStats = async () => {
        try {
            // Alterado de 'despesas' para 'gastos' para puxar da nova tabela do Meu Caixa
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

            // Calcula faturamento do mês atual
            pedidos.forEach(p => {
                if (!p.data_entrega) return;
                const dataEntrega = new Date(p.data_entrega);
                dataEntrega.setMinutes(dataEntrega.getMinutes() + dataEntrega.getTimezoneOffset());
                if (dataEntrega.getMonth() === mesAtual && dataEntrega.getFullYear() === anoAtual && p.status !== 'cancelado') {
                    newStats.faturamentoMes += Number(p.valor) || 0;
                }
            });

            // Calcula gastos do mês atual
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
            // 1. Avisa o Supabase para encerrar a sessão
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // 2. Limpa qualquer rastro no navegador (LocalStorage)
            localStorage.clear();
            sessionStorage.clear();

            // 3. Força o redirecionamento para o login
            // Usamos o window.location para garantir que a página dê um "refresh" total
            window.location.href = "/auth";

            toast.success("Até logo, Fabi!");
        } catch (error) {
            toast.error("Erro ao sair. Tente fechar o navegador.");
            console.error("Erro logout:", error);
        }
    };

    const formatarDinheiro = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando painel...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-12">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logoImg} alt="Logomarca Fabbis" className="h-16 w-auto object-contain" />
                        <p className="text-sm text-muted-foreground font-medium hidden md:block">Gestão Fabbis</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Sair
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Painel de Controle</h2>
                    <p className="text-muted-foreground">Acompanhe seus pedidos e a saúde financeira do mês.</p>
                </div>

                {/* --- SEÇÃO 1: STATUS DOS PEDIDOS --- */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
                    <Card onClick={() => navigate('/pedidos')} className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><Package className="h-8 w-8 text-primary" /><Badge variant="secondary">{stats.total}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Geral</h3><p className="text-2xl font-bold">{stats.total}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=pendente')} className="p-6 bg-gradient-to-br from-card to-card/50 border-yellow-500/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><ThumbsUp className="h-8 w-8 text-yellow-500" /><Badge className="bg-yellow-500 text-white">{stats.pendente}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Pedidos Feitos</h3><p className="text-2xl font-bold">{stats.pendente}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=em_producao')} className="p-6 bg-gradient-to-br from-card to-card/50 border-blue-500/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><Clock className="h-8 w-8 text-blue-500" /><Badge className="bg-blue-500 text-white">{stats.em_producao}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Em Produção</h3><p className="text-2xl font-bold">{stats.em_producao}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=concluido')} className="p-6 bg-gradient-to-br from-card to-card/50 border-green-600/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><CheckCheck className="h-8 w-8 text-green-600" /><Badge className="bg-green-600 text-white">{stats.concluido}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Concluídos</h3><p className="text-2xl font-bold">{stats.concluido}</p>
                    </Card>

                    <Card onClick={() => navigate('/pedidos?status=entregue')} className="p-6 bg-gradient-to-br from-card to-card/50 border-green-700/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><Truck className="h-8 w-8 text-green-700" /><Badge className="bg-green-700 text-white">{stats.entregue}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Entregues</h3><p className="text-2xl font-bold">{stats.entregue}</p>
                    </Card>
                </div>

                {/* --- SEÇÃO 2: AÇÕES RÁPIDAS --- */}
                <Card className="p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-6">Ações Rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button className="w-full justify-start h-12" onClick={() => navigate("/pedidos/novo")}>
                            <Plus className="h-5 w-5 mr-2" /> Novo Pedido
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigate("/clientes")}>
                            <Users className="h-5 w-5 mr-2" /> Gerenciar Clientes
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigate("/materiais")}>
                            <Palette className="h-5 w-5 mr-2" /> Meus Materiais
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 border-primary/50 hover:bg-primary/5" onClick={() => navigate('/agenda')}>
                            <Calendar className="h-5 w-5 mr-2 text-primary" /> Agenda de Entregas
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 border-green-500/50 hover:bg-green-500/5" onClick={() => navigate('/financeiro')}>
                            <DollarSign className="h-5 w-5 mr-2 text-green-500" /> Meu Caixa
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12" onClick={() => navigate('/catalogo')}>
                            <Store className="h-5 w-5 mr-2" /> Vitrine de Biquínis
                        </Button>
                    </div>
                </Card>

                {/* --- SEÇÃO 3: FINANCEIRO (CARDS GRANDES NO FINAL) --- */}
                <h3 className="text-lg font-semibold mb-4">Resumo Financeiro do Mês</h3>
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-500/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500 rounded-full text-white"><DollarSign className="h-6 w-6" /></div>
                            <div>
                                <h3 className="text-xs font-bold text-green-800 dark:text-green-200 uppercase">Faturamento Estimado</h3>
                                <p className="text-3xl font-bold text-green-700 dark:text-green-400">{formatarDinheiro(stats.faturamentoMes)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-500/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500 rounded-full text-white"><ArrowDownCircle className="h-6 w-6" /></div>
                            <div>
                                <h3 className="text-xs font-bold text-red-800 dark:text-red-200 uppercase">Despesas Registradas</h3>
                                <p className="text-3xl font-bold text-red-700 dark:text-red-400">{formatarDinheiro(stats.despesasTotais)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-500/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-full text-white"><PieChart className="h-6 w-6" /></div>
                            <div>
                                <h3 className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">Lucro Líquido Real</h3>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{formatarDinheiro(stats.faturamentoMes - stats.despesasTotais)}</p>
                            </div>
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}