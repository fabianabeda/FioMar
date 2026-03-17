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
    Upload,
    Image as ImageIcon
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

    // Estados para o Modal
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
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
            let publicUrl = "";
            if (arquivoFoto) {
                const nomeArq = `mat-${Math.random().toString(36).substring(2)}.jpg`;
                await supabase.storage.from("catalogo").upload(nomeArq, arquivoFoto);
                const { data } = supabase.storage.from("catalogo").getPublicUrl(nomeArq);
                publicUrl = data.publicUrl;
            }

            const { error } = await supabase.from("materiais").insert([{
                nome: novoMat.nome,
                tipo: novoMat.tipo,
                foto_url: publicUrl
            }]);

            if (error) throw error;
            toast.success("Material adicionado!");
            fecharModal();
            loadMateriais();
        } catch (error) {
            toast.error("Erro ao salvar.");
        } finally {
            setSalvando(false);
        }
    };

    const fecharModal = () => {
        setModalAberto(false);
        setNovoMat({ nome: "", tipo: "tecido" });
        setPreviewUrl(null);
        setArquivoFoto(null);
    };

    const handleExcluir = async (id: string, fotoUrl?: string) => {
        if (!confirm("Excluir este item?")) return;
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

    const filteredMateriais = useMemo(() => {
        return materiais.filter(m =>
            m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.tipo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [materiais, searchTerm]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-cyan-600 uppercase tracking-widest">
            Carregando Ateliê...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg shadow-sm" />
                    <Button variant="ghost" size="sm" className="font-bold text-slate-400 hover:text-cyan-600" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Painel
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Cabeçalho */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                    <div className="text-center md:text-left w-full">
                        <h1 className="leading-tight flex flex-col md:flex-row md:items-baseline justify-center md:justify-start">
                            <span className="text-7xl md:text-8xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Meus</span>
                            <span className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-[0.2em] ml-0 md:ml-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Materiais</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                            <div className="h-[2px] w-12 bg-cyan-200 hidden md:block"></div>
                            <p className="text-slate-500 font-bold tracking-[0.3em] text-sm md:text-base uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Tecidos • Linhas • Roletes</p>
                        </div>
                    </div>
                    <Button
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black h-14 px-8 shadow-2xl transition-all hover:scale-105 w-full md:w-auto"
                        onClick={() => setModalAberto(true)}
                    >
                        <Plus className="h-6 w-6 mr-2" /> NOVO ITEM
                    </Button>
                </div>

                {/* Busca */}
                <div className="relative mb-12">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                    <Input
                        placeholder="Pesquisar por nome ou tipo..."
                        className="pl-16 h-16 rounded-3xl border-none shadow-sm bg-white text-lg placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                    {filteredMateriais.map(material => (
                        <Card key={material.id} className="overflow-hidden rounded-[2.5rem] border-none shadow-md hover:shadow-2xl transition-all group bg-white">
                            <div className="aspect-square bg-slate-50 relative overflow-hidden border-b border-slate-50">
                                {material.foto_url ? (
                                    <img src={material.foto_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt={material.nome} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                                        <ImageIcon className="h-12 w-12" />
                                    </div>
                                )}

                                <button
                                    onClick={() => handleExcluir(material.id, material.foto_url)}
                                    className="absolute top-4 right-4 p-2.5 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-50"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>

                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-cyan-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {material.tipo}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-slate-800 uppercase text-xs md:text-sm tracking-tight truncate" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                    {material.nome}
                                </h3>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Modal de Cadastro */}
            <Dialog open={modalAberto} onOpenChange={(open) => !open && fecharModal()}>
                <DialogContent className="max-w-md rounded-[3rem] bg-white border-none p-8 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-2xl uppercase italic text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                            Novo Material
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSalvar} className="space-y-6 mt-6">

                        {/* ÁREA DE FOTO / UPLOAD (BEM VISÍVEL) */}
                        <div
                            onClick={() => inputFileRef.current?.click()}
                            className="relative h-56 w-full border-4 border-dashed border-cyan-200 bg-cyan-50/30 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all overflow-hidden"
                        >
                            {previewUrl ? (
                                <>
                                    <img src={previewUrl} className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Camera className="text-white h-10 w-10" />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <div className="bg-white p-5 rounded-full shadow-md mb-4 inline-block">
                                        <Camera className="h-8 w-8 text-cyan-500" />
                                    </div>
                                    <p className="text-sm font-black text-cyan-600 uppercase tracking-widest mb-1">
                                        Toque para Fotografar
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                        ou clique para upload
                                    </p>
                                    <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                                        <Upload className="h-4 w-4" />
                                        <span className="text-[10px] font-black underline">ESCOLHER ARQUIVO</span>
                                    </div>
                                </div>
                            )}
                            {/* Input escondido que faz a mágica */}
                            <input
                                type="file"
                                accept="image/*"
                                ref={inputFileRef}
                                className="hidden"
                                onChange={handleSelecionarFoto}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nome do Material</label>
                            <Input
                                placeholder="Ex: Lycra Brilhosa Turquesa"
                                value={novoMat.nome}
                                onChange={e => setNovoMat({...novoMat, nome: e.target.value})}
                                className="h-14 rounded-2xl font-bold bg-slate-50 border-none px-5 text-slate-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Categoria</label>
                            <select
                                value={novoMat.tipo}
                                onChange={e => setNovoMat({...novoMat, tipo: e.target.value})}
                                className="w-full h-14 rounded-2xl font-bold bg-slate-50 border-none px-5 appearance-none text-slate-700 cursor-pointer"
                            >
                                <option value="tecido">Tecido</option>
                                <option value="linha">Linha</option>
                                <option value="rolete">Rolete</option>
                            </select>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-16 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-cyan-100 mt-4 transition-all active:scale-95"
                            disabled={salvando}
                        >
                            {salvando ? "CADASTRANDO..." : "ADICIONAR AO ESTOQUE"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}