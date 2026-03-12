import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Award, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo-fabbis.jpeg";

export default function Relatorios() {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatorios = async () => {
            const { data } = await supabase.from("pedidos").select("*").neq("status", "cancelado");
            setPedidos(data || []);
            setLoading(false);
        };
        fetchRelatorios();
    }, []);

    const estatisticas = useMemo(() => {
        const modelos: Record<string, number> = {};
        let totalFaturado = 0;

        pedidos.forEach(p => {
            modelos[p.produto] = (modelos[p.produto] || 0) + 1;
            totalFaturado += Number(p.valor);
        });

        const topModelo = Object.entries(modelos).sort((a, b) => b[1] - a[1])[0];

        return {
            totalPedidos: pedidos.length,
            totalFaturado,
            maisVendido: topModelo ? topModelo[0] : "Nenhum",
            ranking: Object.entries(modelos).sort((a, b) => b[1] - a[1])
        };
    }, [pedidos]);

    return (
        <div className="min-h-screen bg-slate-50 pb-10">
            <header className="bg-white border-b p-4 mb-6">
                <div className="container mx-auto flex justify-between items-center">
                    <img src={logoImg} className="h-12" alt="Logo" />
                    <Button variant="ghost" onClick={() => navigate("/")}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                </div>
            </header>

            <main className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-black text-slate-900 mb-6">Desempenho do Ateliê</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="p-6 bg-blue-600 text-white rounded-[2rem] border-none">
                        <DollarSign className="mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase opacity-80">Total Faturado</p>
                        <p className="text-2xl font-black">R$ {estatisticas.totalFaturado.toFixed(2)}</p>
                    </Card>
                    <Card className="p-6 bg-pink-600 text-white rounded-[2rem] border-none">
                        <Award className="mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase opacity-80">Mais Vendido</p>
                        <p className="text-2xl font-black truncate">{estatisticas.maisVendido}</p>
                    </Card>
                    <Card className="p-6 bg-emerald-600 text-white rounded-[2rem] border-none">
                        <TrendingUp className="mb-2 opacity-50" />
                        <p className="text-xs font-bold uppercase opacity-80">Total Pedidos</p>
                        <p className="text-2xl font-black">{estatisticas.totalPedidos}</p>
                    </Card>
                </div>

                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white">
                    <h2 className="text-xl font-black mb-6">Ranking de Modelos</h2>
                    <div className="space-y-4">
                        {estatisticas.ranking.map(([nome, qtd], index) => (
                            <div key={nome} className="flex items-center gap-4">
                                <span className="font-bold text-slate-300 w-4">#{index + 1}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-slate-700 uppercase text-sm">{nome}</span>
                                        <span className="text-sm font-black">{qtd} vendas</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-pink-500 h-full rounded-full transition-all"
                                            style={{ width: `${(qtd / estatisticas.totalPedidos) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </main>
        </div>
    );
}