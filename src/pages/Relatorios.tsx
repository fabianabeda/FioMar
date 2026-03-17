import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    TrendingUp,
    Award,
    DollarSign,
    PieChart,
    ShoppingBag,
    Star
} from "lucide-react";
import logoImg from "@/assets/logo-fabbis.jpeg";

export default function Relatorios() {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatorios = async () => {
            setLoading(true);
            const { data } = await supabase
                .from("pedidos")
                .select("*")
                .neq("status", "cancelado");
            setPedidos(data || []);
            setLoading(false);
        };
        fetchRelatorios();
    }, []);

    const estatisticas = useMemo(() => {
        const modelos: Record<string, number> = {};
        let totalFaturado = 0;

        pedidos.forEach(p => {
            const nomeProduto = p.produto || "Não especificado";
            modelos[nomeProduto] = (modelos[nomeProduto] || 0) + 1;
            totalFaturado += Number(p.valor || 0);
        });

        const ranking = Object.entries(modelos).sort((a, b) => b[1] - a[1]);
        const topModelo = ranking[0];

        return {
            totalPedidos: pedidos.length,
            totalFaturado,
            maisVendido: topModelo ? topModelo[0] : "---",
            ranking
        };
    }, [pedidos]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-pink-500 uppercase tracking-widest">
            Analisando Sucesso...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg" onClick={() => navigate("/")} />
                    <Button variant="ghost" size="sm" className="font-bold text-slate-400" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Painel
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* TÍTULO ESTILIZADO */}
                <div className="text-center md:text-left mb-12">
                    <h1 className="leading-tight flex flex-col md:flex-row md:items-baseline">
                        <span className="text-7xl md:text-8xl text-pink-500" style={{ fontFamily: "'Allura', cursive" }}>Meu</span>
                        <span className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-[0.2em] ml-0 md:ml-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Sucesso</span>
                    </h1>
                </div>

                {/* CARDS DE DESTAQUE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="p-8 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-[2.5rem] border-none shadow-xl shadow-cyan-100 relative overflow-hidden group">
                        <DollarSign className="absolute -right-2 -bottom-2 h-24 w-24 opacity-20 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Faturamento Bruto</p>
                            <p className="text-4xl font-black tracking-tighter">
                                <span className="text-lg mr-1">R$</span>
                                {estatisticas.totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </Card>

                    <Card className="p-8 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-[2.5rem] border-none shadow-xl shadow-pink-100 relative overflow-hidden group">
                        <Star className="absolute -right-2 -bottom-2 h-24 w-24 opacity-20 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">O Queridinho</p>
                            <p className="text-3xl font-black truncate tracking-tighter uppercase">{estatisticas.maisVendido}</p>
                        </div>
                    </Card>

                    <Card className="p-8 bg-slate-900 text-white rounded-[2.5rem] border-none shadow-xl shadow-slate-200 relative overflow-hidden group">
                        <ShoppingBag className="absolute -right-2 -bottom-2 h-24 w-24 opacity-10 group-hover:scale-110 transition-transform" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Total de Peças</p>
                            <p className="text-4xl font-black tracking-tighter">{estatisticas.totalPedidos}</p>
                        </div>
                    </Card>
                </div>

                {/* RANKING DETALHADO */}
                <Card className="p-10 rounded-[3rem] border-none shadow-sm bg-white">
                    <div className="flex items-center gap-3 mb-10">
                        <PieChart className="h-6 w-6 text-pink-500" />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Ranking de Produção</h2>
                    </div>

                    <div className="space-y-8">
                        {estatisticas.ranking.length > 0 ? (
                            estatisticas.ranking.map(([nome, qtd], index) => (
                                <div key={nome} className="group">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-black text-slate-100 group-hover:text-pink-100 transition-colors">
                                                {(index + 1).toString().padStart(2, '0')}
                                            </span>
                                            <div>
                                                <span className="font-black text-slate-700 uppercase text-sm tracking-tight">{nome}</span>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{qtd} pedidos realizados</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full">
                                            {((qtd / estatisticas.totalPedidos) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-50 h-4 rounded-2xl overflow-hidden p-1 border border-slate-100">
                                        <div
                                            className="bg-gradient-to-r from-pink-400 to-pink-500 h-full rounded-xl transition-all duration-1000"
                                            style={{ width: `${(qtd / estatisticas.totalPedidos) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-400 font-bold italic tracking-widest uppercase text-xs">Sem dados suficientes para gerar o ranking.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* RODAPÉ INSPIRADOR */}
                <div className="mt-12 text-center">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                        Fabbis Boutique • Feito à mão com amor
                    </p>
                </div>
            </main>
        </div>
    );
}