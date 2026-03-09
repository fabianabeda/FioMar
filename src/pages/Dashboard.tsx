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
} from "lucide-react";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

// IMPORTAÇÃO DA LOGOMARCA
import logoImg from "@/assets/logo-fabbis.jpeg"; // Lembre-se de mudar para .jpeg se precisar

interface DashboardStats {
    total: number;
    pendente: number;
    em_producao: number;
    concluido: number;
    entregue: number;
    totalClientes: number;
    faturamentoMes: number;
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
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        loadStats();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
        }
    };

    const loadStats = async () => {
        try {
            const [pedidosRes, clientesRes] = await Promise.all([
                supabase.from("pedidos").select("status, valor, data_entrega"),
                supabase.from("clientes").select("id", { count: "exact", head: true })
            ]);

            if (pedidosRes.error) throw pedidosRes.error;
            if (clientesRes.error) throw clientesRes.error;

            const pedidos = pedidosRes.data || [];

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
            };

            pedidos.forEach(p => {
                const dataEntrega = new Date(p.data_entrega);
                dataEntrega.setMinutes(dataEntrega.getMinutes() + dataEntrega.getTimezoneOffset());

                if (dataEntrega.getMonth() === mesAtual && dataEntrega.getFullYear() === anoAtual && p.status !== 'cancelado') {
                    newStats.faturamentoMes += Number(p.valor) || 0;
                }
            });

            setStats(newStats);
        } catch (error) {
            const pgError = error as PostgrestError;
            console.error("Erro ao carregar estatísticas:", pgError);
            toast.error(pgError.message || "Erro ao carregar dados do dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    const navigateToPedidos = (status: string) => {
        navigate(`/pedidos?status=${status}`);
    };

    const formatarDinheiro = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">A carregar...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logoImg} alt="Logomarca Fabbis" className="h-32 w-auto object-contain" />
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Gestão de Pedidos</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
                    <p className="text-muted-foreground">Visão geral dos seus pedidos e clientes</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-8">
                    <Card onClick={() => navigateToPedidos('all')} className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><Package className="h-8 w-8 text-primary" /><Badge variant="secondary">{stats.total}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total de Pedidos</h3><p className="text-2xl font-bold">{stats.total}</p>
                    </Card>

                    <Card onClick={() => navigateToPedidos('pendente')} className="p-6 bg-gradient-to-br from-card to-card/50 border-yellow-500/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><ThumbsUp className="h-8 w-8 text-yellow-500" /><Badge className="bg-yellow-500 text-white">{stats.pendente}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Pedidos Feitos</h3><p className="text-2xl font-bold">{stats.pendente}</p>
                    </Card>

                    <Card onClick={() => navigateToPedidos('em_producao')} className="p-6 bg-gradient-to-br from-card to-card/50 border-blue-500/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><Clock className="h-8 w-8 text-blue-500" /><Badge className="bg-blue-500 text-white">{stats.em_producao}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Em Produção</h3><p className="text-2xl font-bold">{stats.em_producao}</p>
                    </Card>

                    <Card onClick={() => navigateToPedidos('concluido')} className="p-6 bg-gradient-to-br from-card to-card/50 border-green-600/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><CheckCheck className="h-8 w-8 text-green-600" /><Badge className="bg-green-600 text-white">{stats.concluido}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Concluídos</h3><p className="text-2xl font-bold">{stats.concluido}</p>
                    </Card>

                    <Card onClick={() => navigateToPedidos('entregue')} className="p-6 bg-gradient-to-br from-card to-card/50 border-green-700/20 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between mb-4"><Truck className="h-8 w-8 text-green-700" /><Badge className="bg-green-700 text-white">{stats.entregue}</Badge></div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Entregues</h3><p className="text-2xl font-bold">{stats.entregue}</p>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-8">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
                        <div className="space-y-3">
                            <Button className="w-full justify-start" onClick={() => navigate("/pedidos/novo")}><Plus className="h-4 w-4 mr-2" />Novo Pedido</Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/pedidos")}><Package className="h-4 w-4 mr-2" />Ver Todos os Pedidos</Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/clientes")}><Users className="h-4 w-4 mr-2" />Gerenciar Clientes</Button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Resumo de Status</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => navigateToPedidos('pendente')}>
                                <span className="text-sm text-muted-foreground">Pedidos Feitos</span>
                                <Badge className="bg-yellow-500 text-white">{stats.pendente}</Badge>
                            </div>
                            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => navigateToPedidos('em_producao')}>
                                <span className="text-sm text-muted-foreground">Em Produção</span>
                                <Badge className="bg-blue-500 text-white">{stats.em_producao}</Badge>
                            </div>
                            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => navigateToPedidos('concluido')}>
                                <span className="text-sm text-muted-foreground">Concluídos</span>
                                <Badge className="bg-green-600 text-white">{stats.concluido}</Badge>
                            </div>
                            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => navigateToPedidos('entregue')}>
                                <span className="text-sm text-muted-foreground">Entregues</span>
                                <Badge className="bg-green-700 text-white">{stats.entregue}</Badge>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- CARD DE FATURAMENTO MOVIDO PARA O FINAL --- */}
                <div className="mt-8">
                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-500/30">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-green-500 rounded-full text-white">
                                <DollarSign className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                                    Faturação do Mês Atual (Entregas previstas para este mês)
                                </h3>
                                <p className="text-4xl font-bold text-green-700 dark:text-green-400">
                                    {formatarDinheiro(stats.faturamentoMes)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

            </main>
        </div>
    );
}