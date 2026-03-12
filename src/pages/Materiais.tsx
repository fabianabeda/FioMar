import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Plus,
    Search,
    Palette,
    AlertTriangle,
    Edit3,
    Trash2,
    PackageCheck,
    TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

interface Material {
    id: string;
    nome: string;
    categoria: string;
    quantidade: number;
    unidade_medida: string;
    estoque_minimo: number;
    cor_hex?: string;
}

export default function Materiais() {
    const navigate = useNavigate();
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadMateriais();
    }, []);

    const loadMateriais = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("materiais")
                .select("*")
                .order("nome", { ascending: true });

            if (error) throw error;
            setMateriais(data || []);
        } catch (error) {
            toast.error("Erro ao carregar materiais.");
        } finally {
            setLoading(false);
        }
    };

    const filteredMateriais = useMemo(() => {
        return materiais.filter(m =>
            m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [materiais, searchTerm]);

    // Lógica de Alerta de Estoque
    const getStatusEstoque = (m: Material) => {
        if (m.quantidade <= 0) return { label: "Esgotado", color: "bg-red-500", border: "border-red-500 shadow-red-100", icon: <AlertTriangle className="h-4 w-4" /> };
        if (m.quantidade <= (m.estoque_minimo || 1)) return { label: "Estoque Baixo", color: "bg-amber-500", border: "border-amber-400 shadow-amber-100", icon: <TrendingDown className="h-4 w-4" /> };
        return { label: "Em Dia", color: "bg-green-600", border: "border-slate-100", icon: <PackageCheck className="h-4 w-4" /> };
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">Carregando estoque...</div>;

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

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Meus Materiais</h1>
                        <p className="text-slate-500 text-sm mt-1">Controle de tecidos, linhas e acessórios</p>
                    </div>
                    <Button className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold" onClick={() => navigate("/materiais/novo")}>
                        <Plus className="h-4 w-4 mr-2" /> Novo Material
                    </Button>
                </div>

                {/* Barra de Busca */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome ou categoria (ex: Lycra, Linha, Elástico)..."
                        className="pl-12 h-14 rounded-2xl border-none shadow-sm bg-white text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Grid de Materiais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMateriais.length > 0 ? (
                        filteredMateriais.map(material => {
                            const status = getStatusEstoque(material);
                            return (
                                <Card key={material.id} className={`p-5 rounded-[2rem] transition-all hover:shadow-xl border-2 ${status.border} bg-white group`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${status.color} text-white shadow-lg`}>
                                            <Palette className="h-6 w-6" />
                                        </div>
                                        <Badge className={`${status.color} border-none text-[10px] uppercase font-black px-3 py-1`}>
                                            {status.icon} <span className="ml-1">{status.label}</span>
                                        </Badge>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-pink-600 transition-colors uppercase">
                                            {material.nome}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {material.categoria}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Quantidade</p>
                                            <p className="text-2xl font-black text-slate-900">
                                                {material.quantidade} <span className="text-sm font-bold text-slate-500">{material.unidade_medida}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Mínimo</p>
                                            <p className="text-sm font-bold text-slate-600">{material.estoque_minimo} {material.unidade_medida}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-xs"
                                            onClick={() => navigate(`/materiais/editar/${material.id}`)}
                                        >
                                            <Edit3 className="h-4 w-4 mr-2 text-slate-400" /> EDITAR
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-[2rem] shadow-sm">
                            <Palette className="h-16 w-16 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-500 font-black text-xl">Nenhum material encontrado.</p>
                            <p className="text-slate-400 text-sm">Tente mudar o termo da busca ou cadastre um novo material.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}