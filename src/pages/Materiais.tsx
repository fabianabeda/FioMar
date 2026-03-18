import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Plus,
    Search,
    Trash2,
    Camera,
    Image as ImageIcon,
    Edit // <-- NOVO: Ícone de Edição
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

interface Material {
    id: string;
    nome: string;
    tipo: string;
    foto_url?: string;
}

export default function Materiais() {
    const navigate = useNavigate();
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    // NOVO: Estado para saber se estamos editando um material existente
    const [materialEditandoId, setMaterialEditandoId] = useState<string | null>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
    const [fotoOriginalUrl, setFotoOriginalUrl] = useState<string | null>(null); // NOVO: Guarda a foto antiga na edição
    const inputFileRef = useRef<HTMLInputElement>(null);

    const [novoMat, setNovoMat] = useState({ nome: "", tipo: "tecido" });

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

    const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setArquivoFoto(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoMat.nome) return toast.error("O nome é obrigatório!");

        setSalvando(true);
        try {
            let publicUrl = fotoOriginalUrl || ""; // Mantém a foto antiga por padrão

            // Se o usuário escolheu uma foto nova, faz o upload
            if (arquivoFoto) {
                const nomeArq = `mat-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
                await supabase.storage.from("catalogo").upload(nomeArq, arquivoFoto);
                const { data } = supabase.storage.from("catalogo").getPublicUrl(nomeArq);
                publicUrl = data.publicUrl;

                // Tenta remover a foto antiga para economizar espaço
                if (fotoOriginalUrl) {
                    const nomeAntigo = fotoOriginalUrl.split('/').pop();
                    if (nomeAntigo) await supabase.storage.from("catalogo").remove([nomeAntigo]);
                }
            }

            if (materialEditandoId) {
                // MODO DE EDIÇÃO
                const { error } = await supabase.from("materiais").update({
                    nome: novoMat.nome,
                    tipo: novoMat.tipo,
                    foto_url: publicUrl || null
                }).eq("id", materialEditandoId);

                if (error) throw error;
                toast.success("Material atualizado com sucesso! ✨");
            } else {
                // MODO DE CRIAÇÃO
                const { error } = await supabase.from("materiais").insert([{
                    nome: novoMat.nome,
                    tipo: novoMat.tipo,
                    foto_url: publicUrl || null
                }]);

                if (error) throw error;
                toast.success("Material adicionado com sucesso! ✨");
            }

            fecharModal();
            loadMateriais();
        } catch (error) {
            toast.error("Erro ao salvar.");
        } finally {
            setSalvando(false);
        }
    };

    // NOVO: Função para abrir o modal em modo de edição
    const abrirModalEditar = (material: Material) => {
        setMaterialEditandoId(material.id);
        setNovoMat({ nome: material.nome, tipo: material.tipo });
        setPreviewUrl(material.foto_url || null);
        setFotoOriginalUrl(material.foto_url || null);
        setArquivoFoto(null);
        setModalAberto(true);
    };

    // NOVO: Função para abrir o modal limpo (Novo Cadastro)
    const abrirModalNovo = () => {
        setMaterialEditandoId(null);
        setNovoMat({ nome: "", tipo: "tecido" });
        setPreviewUrl(null);
        setFotoOriginalUrl(null);
        setArquivoFoto(null);
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        // Limpa tudo após o modal fechar para não dar conflito na próxima vez
        setTimeout(() => {
            setMaterialEditandoId(null);
            setNovoMat({ nome: "", tipo: "tecido" });
            setPreviewUrl(null);
            setFotoOriginalUrl(null);
            setArquivoFoto(null);
        }, 300);
    };

    const handleExcluir = async (id: string, fotoUrl?: string) => {
        if (!confirm("Deseja realmente remover este material?")) return;
        try {
            if (fotoUrl) {
                const nomeArq = fotoUrl.split('/').pop();
                if (nomeArq) await supabase.storage.from("catalogo").remove([nomeArq]);
            }
            await supabase.from("materiais").delete().eq("id", id);
            toast.success("Removido.");
            loadMateriais();
        } catch (error) {
            toast.error("Erro ao excluir.");
        }
    };

    const categoriasAgrupadas = useMemo(() => {
        const filtrados = materiais.filter(m =>
            (m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.tipo.toLowerCase().includes(searchTerm.toLowerCase())) &&
            m.tipo !== "rolete"
        );

        return filtrados.reduce((acc: { [key: string]: Material[] }, material) => {
            const tipo = material.tipo || "Outros";
            if (!acc[tipo]) acc[tipo] = [];
            acc[tipo].push(material);
            return acc;
        }, {});
    }, [materiais, searchTerm]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-[#06B6D4] uppercase tracking-widest">
            Organizando Ateliê Fabbis...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');
                  .font-allura { font-family: 'Allura', cursive; }
                  .font-montserrat { font-family: 'Montserrat', sans-serif; }
                `}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-10 w-auto rounded-lg" />
                    <Button variant="ghost" size="sm" className="font-bold text-slate-400 hover:text-[#06B6D4]" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Painel
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <h1 className="leading-tight text-center md:text-left">
                        <span className="text-6xl text-[#06B6D4] font-allura">Meus</span>
                        <span className="text-xl font-black text-slate-400 uppercase tracking-[0.2em] ml-3 font-montserrat">Materiais</span>
                    </h1>
                    <Button
                        className="bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl font-black h-11 px-6 shadow-md transition-all hover:scale-105"
                        onClick={abrirModalNovo} // <-- Usando a nova função limpa
                    >
                        <Plus className="h-5 w-5 mr-2" /> NOVO ITEM
                    </Button>
                </div>

                <div className="relative mb-10 max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input
                        placeholder="Pesquisar tecido ou linha..."
                        className="pl-12 h-12 rounded-2xl border-none shadow-sm bg-white text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-[#06B6D4]/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {Object.entries(categoriasAgrupadas).map(([categoria, itens]) => (
                    <div key={categoria} className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-3xl font-allura text-[#06B6D4] capitalize">{categoria}s</h2>
                            <div className="h-[1px] flex-1 bg-slate-100 ml-2" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                {itens.length} unid.
                            </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                            {itens.map(material => (
                                <Card key={material.id} className="overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-md transition-all group bg-white">
                                    <div className="aspect-square bg-slate-50 relative overflow-hidden">
                                        {material.foto_url ? (
                                            <img src={material.foto_url} className="w-full h-full object-cover" alt={material.nome} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                        )}

                                        {/* NOVO: Ações que aparecem no Hover (Editar e Excluir) */}
                                        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => abrirModalEditar(material)}
                                                className="p-1.5 bg-white/90 text-[#06B6D4] rounded-full shadow-sm hover:bg-white hover:scale-110 transition-all"
                                                title="Editar"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleExcluir(material.id, material.foto_url)}
                                                className="p-1.5 bg-white/90 text-red-500 rounded-full shadow-sm hover:bg-white hover:scale-110 transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-2 text-center">
                                        <h3 className="font-bold text-slate-600 uppercase text-[9px] leading-tight truncate font-montserrat">
                                            {material.nome}
                                        </h3>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            <Dialog open={modalAberto} onOpenChange={(open) => !open && fecharModal()}>
                <DialogContent className="max-w-md rounded-[2.5rem] bg-white border-none p-8">
                    <DialogHeader>
                        <DialogTitle className="text-3xl text-[#06B6D4] font-allura">
                            {materialEditandoId ? "Editar Material" : "Novo Material"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSalvar} className="space-y-5 mt-4">
                        <div
                            onClick={() => inputFileRef.current?.click()}
                            className="relative h-44 w-full border-2 border-dashed border-cyan-100 bg-cyan-50/20 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-black text-[10px] uppercase bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full">Alterar Foto</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center flex flex-col items-center">
                                    <Camera className="h-7 w-7 text-[#06B6D4] mb-1" />
                                    <p className="text-[9px] font-black text-[#06B6D4] uppercase tracking-widest">Anexar Foto</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFoto} />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest font-montserrat">Nome do Material</label>
                            <Input
                                placeholder="Ex: Lycra Brilhosa Turquesa"
                                value={novoMat.nome}
                                onChange={e => setNovoMat({...novoMat, nome: e.target.value})}
                                className="h-12 rounded-xl bg-slate-50 border-none px-5 font-bold text-slate-700"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest font-montserrat">Categoria</label>
                            <select
                                value={novoMat.tipo}
                                onChange={e => setNovoMat({...novoMat, tipo: e.target.value})}
                                className="w-full h-12 rounded-xl bg-slate-50 border-none px-5 font-bold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-cyan-100"
                            >
                                <option value="tecido">Tecido (Lycra)</option>
                                <option value="linha">Linha</option>
                            </select>
                        </div>

                        <Button type="submit" className="w-full h-14 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-xl font-black shadow-lg uppercase tracking-widest text-[11px]" disabled={salvando}>
                            {salvando ? "SALVANDO..." : (materialEditandoId ? "SALVAR ALTERAÇÕES" : "ADICIONAR AO ESTOQUE")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}