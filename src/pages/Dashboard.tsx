import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Trash2
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
    despesasMes: number;
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
        despesasMes: 0,
    });
    const [listaDespesas, setListaDespesas] = useState<any[]>([]);
    const [novaDespesa, setNovaDespesa] = useState({ descricao: "", valor: "" });
    const [loading, setLoading] = useState(true);
    const [savingDespesa, setSavingDespesa] = useState(false);

    useEffect(() => {
        checkAuth();
        loadStats();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate("/auth");
    };

    const loadStats = async () => {
        try {
            const [pedidosRes, clientesRes, despesasRes] = await Promise.all([
                supabase.from("pedidos").select("status, valor, data_entrega"),
                supabase.from("clientes").select("id", { count: "exact", head: true }),
                supabase.from("despesas").select("*").order("created_at", { ascending: false })
            ]);

            if (pedidosRes.error) throw pedidosRes.error;
            if (clientesRes.error) throw clientesRes.error;
            if (despesasRes.error) throw despesasRes.error;

            const pedidos = pedidosRes.data || [];
            const despesas = despesasRes.data || [];
            setListaDespesas(despesas);

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
                despesasMes: despesas.reduce((acc, curr) => acc + Number(curr.valor), 0),
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
            toast.error("Erro ao carregar dados do dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleAdicionarDespesa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaDespesa.descricao || !novaDespesa.valor) return;
        setSavingDespesa(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from("despesas").insert({
                user_id: user?.id,
                descricao: novaDespesa.descricao,
                valor: parseFloat(novaDespesa.valor)
            });

            if (error) throw error;
            toast.success("Gasto registrado!");
            setNovaDespesa({ descricao: "", valor: "" });
            loadStats();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSavingDespesa(false);
        }
    };

    const handleExcluirDespesa = async (id: string) => {
        await supabase.from("despesas").delete().eq("id", id);
        loadStats();
    };

    const formatarDinheiro = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">A carregar...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-10">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <img src={logoImg} alt="Logo" className="h-24 w-auto object-contain" />
                    <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}><LogOut className="h-4 w-4 mr-2" /> Sair</Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* 1. INDICADORES DE PEDIDOS */}
                <div className="grid gap-4 md:grid-cols-5 mb-8">
                    <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Total</p><p className="text-xl font-bold">{stats.total}</p></Card>
                    <Card className="p-4 border-l-4 border-yellow-500"><p className="text-xs text-muted-foreground uppercase">Feitos</p><p className="text-xl font-bold">{stats.pendente}</p></Card>
                    <Card className="p-4 border-l-4 border-blue-500"><p className="text-xs text-muted-foreground uppercase">Produção</p><p className="text-xl font-bold">{stats.em_producao}</p></Card>
                    <Card className="p-4 border-l-4 border-green-500"><p className="text-xs text-muted-foreground uppercase">Concluídos</p><p className="text-xl font-bold">{stats.concluido}</p></Card>
                    <Card className="p-4 border-l-4 border-green-700"><p className="text-xs text-muted-foreground uppercase">Entregues</p><p className="text-xl font-bold">{stats.entregue}</p></Card>
                </div>

                {/* 2. FINANCEIRO PRINCIPAL */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    <Card className="p-6 bg-green-50 border-green-200">
                        <div className="flex items-center gap-3 mb-2 text-green-700"><DollarSign className="h-5 w-5" /><h3 className="font-bold uppercase text-xs">Faturamento</h3></div>
                        <p className="text-3xl font-bold text-green-700">{formatarDinheiro(stats.faturamentoMes)}</p>
                    </Card>

                    <Card className="p-6 bg-red-50 border-red-200">
                        <div className="flex items-center gap-3 mb-2 text-red-700"><ArrowDownCircle className="h-5 w-5" /><h3 className="font-bold uppercase text-xs">Despesas Reais</h3></div>
                        <p className="text-3xl font-bold text-red-700">{formatarDinheiro(stats.despesasMes)}</p>
                    </Card>

                    <Card className="p-6 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3 mb-2 text-blue-700"><PieChart className="h-5 w-5" /><h3 className="font-bold uppercase text-xs">Lucro Líquido</h3></div>
                        <p className="text-3xl font-bold text-blue-700">{formatarDinheiro(stats.faturamentoMes - stats.despesasMes)}</p>
                    </Card>
                </div>

                {/* 3. AÇÕES E GESTÃO DE DESPESAS */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="font-bold mb-4">Ações Rápidas</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <Button onClick={() => navigate("/pedidos/novo")}><Plus className="h-4 w-4 mr-2" /> Novo Pedido</Button>
                                <Button variant="outline" onClick={() => navigate("/clientes")}><Users className="h-4 w-4 mr-2" /> Clientes</Button>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-bold mb-4">Lançar Novo Gasto (Tecido, Linha, etc)</h3>
                            <form onSubmit={handleAdicionarDespesa} className="space-y-4">
                                <div><Label>Descrição</Label><Input placeholder="Ex: Compra de Lycra" value={novaDespesa.descricao} onChange={e => setNovaDespesa({...novaDespesa, descricao: e.target.value})} /></div>
                                <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={novaDespesa.valor} onChange={e => setNovaDespesa({...novaDespesa, valor: e.target.value})} /></div>
                                <Button type="submit" className="w-full" disabled={savingDespesa}>{savingDespesa ? "Salvando..." : "Registrar Gasto"}</Button>
                            </form>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h3 className="font-bold mb-4">Histórico de Gastos do Mês</h3>
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {listaDespesas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum gasto registrado.</p>}
                            {listaDespesas.map((d) => (
                                <div key={d.id} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                                    <div><p className="font-medium text-sm">{d.descricao}</p><p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p></div>
                                    <div className="flex items-center gap-3"><span className="font-bold text-red-600 text-sm">-{formatarDinheiro(d.valor)}</span><Button variant="ghost" size="sm" onClick={() => handleExcluirDespesa(d.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}