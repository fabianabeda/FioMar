// pages/Dashboard.tsx (VERSÃO FINAL COM NOVO LAYOUT E CARDS CLICÁVEIS)

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
    AlertCircle,
    Plus,
    LogOut
} from "lucide-react";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

interface DashboardStats {
    total: number;
    pendente: number;
    em_producao: number;
    aguardando_pagamento: number;
    concluido: number;
    entregue: number;
    totalClientes: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        total: 0,
        pendente: 0,
        em_producao: 0,
        aguardando_pagamento: 0,
        concluido: 0,
        entregue: 0,
        totalClientes: 0,
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
            // Otimizado para fazer as duas chamadas em paralelo
            const [pedidosRes, clientesRes] = await Promise.all([
                supabase.from("pedidos").select("status"),
                supabase.from("clientes").select("id", { count: "exact", head: true })
            ]);

            if (pedidosRes.error) throw pedidosRes.error;
            if (clientesRes.error) throw clientesRes.error;

            const pedidos = pedidosRes.data || [];
            const newStats = {
                total: pedidos.length,
                pendente: pedidos.filter(p => p.status === "pendente").length,
                em_producao: pedidos.filter(p => p.status === "em_producao").length,
                aguardando_pagamento: pedidos.filter(p => p.status === "aguardando_pagamento").length,
                concluido: pedidos.filter(p => p.status === "concluido").length,
                entregue: pedidos.filter(p => p.status === "entregue").length,
                totalClientes: clientesRes.count || 0,
            };

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

    // Função para navegar para a página de pedidos com um filtro de status
    const navigateToPedidos = (status: string) => {
        navigate(`/pedidos?status=${status}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            FioMar
                        </h1>
                        <p className="text-sm text-muted-foreground">Gestão de Pedidos</p>
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

                {/* --- CARDS CLICÁVEIS --- */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card
                        onClick={() => navigateToPedidos('all')}
                        className="p-6 bg-gradient-to-br from-card to-card/50 border-primary/20 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Package className="h-8 w-8 text-primary" />
                            <Badge variant="secondary">{stats.total}</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total de Pedidos</h3>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </Card>

                    <Card
                        onClick={() => navigateToPedidos('em_producao')}
                        className="p-6 bg-gradient-to-br from-card to-card/50 border-accent/20 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Clock className="h-8 w-8 text-accent" />
                            <Badge className="bg-accent text-accent-foreground">{stats.em_producao}</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Em Produção</h3>
                        <p className="text-2xl font-bold">{stats.em_producao}</p>
                    </Card>

                    <Card
                        onClick={() => navigateToPedidos('pendente')}
                        className="p-6 bg-gradient-to-br from-card to-card/50 border-secondary/20 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <AlertCircle className="h-8 w-8 text-secondary" />
                            <Badge className="bg-secondary text-secondary-foreground">{stats.pendente}</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Pendentes</h3>
                        <p className="text-2xl font-bold">{stats.pendente}</p>
                    </Card>

                    <Card
                        onClick={() => navigate('/clientes')}
                        className="p-6 bg-gradient-to-br from-card to-card/50 border-border hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Users className="h-8 w-8 text-foreground" />
                            <Badge variant="outline">{stats.totalClientes}</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Clientes</h3>
                        <p className="text-2xl font-bold">{stats.totalClientes}</p>
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
                        <h3 className="text-lg font-semibold mb-4">Status dos Pedidos</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => navigateToPedidos('pendente')}>
                                <span className="text-sm text-muted-foreground">Pendentes</span>
                                <Badge className="bg-yellow-500 text-white">{stats.pendente}</Badge>
                            </div>
                            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => navigateToPedidos('em_producao')}>
                                <span className="text-sm text-muted-foreground">Em Produção</span>
                                <Badge className="bg-blue-500 text-white">{stats.em_producao}</Badge>
                            </div>
                            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md" onClick={() => navigateToPedidos('aguardando_pagamento')}>
                                <span className="text-sm text-muted-foreground">Aguardando Pagamento</span>
                                <Badge className="bg-orange-500 text-white">{stats.aguardando_pagamento}</Badge>
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
            </main>
        </div>
    );
}
