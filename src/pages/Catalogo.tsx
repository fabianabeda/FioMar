import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Camera, Eye, EyeOff, MessageCircle, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

interface Peca { id: string; nome: string; descricao: string; preco: number; foto_url: string[]; }

const comprimirImagem = (file: File, maxWidth = 1000, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width, height = img.height;
                if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => blob ? resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" })) : reject(new Error("Erro")), "image/jpeg", quality);
                } else reject(new Error("Erro no canvas"));
            };
        };
    });
};

export default function Catalogo() {
    const navigate = useNavigate();
    const [pecas, setPecas] = useState<Peca[]>([]);
    const [loading, setLoading] = useState(true);
    const [modoCliente, setModoCliente] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);

    // Edição
    const [editandoId, setEditandoId] = useState<string | null>(null);

    const [arquivosFotos, setArquivosFotos] = useState<File[]>([]);
    const [previewsUrls, setPreviewsUrls] = useState<string[]>([]);
    const [indicesCarrossel, setIndicesCarrossel] = useState<{ [key: string]: number }>({});

    const inputFileRef = useRef<HTMLInputElement>(null);
    const [novaPeca, setNovaPeca] = useState({ nome: "", descricao: "", preco: "" });

    const SEU_TELEFONE = "55839XXXXXXXX"; // COLOQUE SEU NÚMERO AQUI

    useEffect(() => {
        loadPecas();
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsAdmin(true);
            setModoCliente(false);
        }
    };

    const loadPecas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from("catalogo").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            const formatado = (data || []).map(p => ({
                ...p,
                foto_url: Array.isArray(p.foto_url) ? p.foto_url : [p.foto_url]
            }));
            setPecas(formatado);
        } catch (error) { toast.error("Erro ao carregar vitrine."); }
        finally { setLoading(false); }
    };

    const handleSelecionarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setArquivosFotos(filesArray);
            const urls = filesArray.map(file => URL.createObjectURL(file));
            setPreviewsUrls(urls);
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaPeca.nome) return toast.error("Nome é obrigatório!");

        setSalvando(true);
        try {
            let urlsFinais = previewsUrls; // Por padrão, mantém as que já estão lá

            // Se selecionou novas fotos, faz o upload
            if (arquivosFotos.length > 0) {
                const novasUrls: string[] = [];
                for (const foto of arquivosFotos) {
                    let fotoComprimida = await comprimirImagem(foto);
                    const nomeArquivo = `${Math.random().toString(36).substring(2)}.jpg`;
                    await supabase.storage.from("catalogo").upload(nomeArquivo, fotoComprimida);
                    const { data } = supabase.storage.from("catalogo").getPublicUrl(nomeArquivo);
                    novasUrls.push(data.publicUrl);
                }
                urlsFinais = novasUrls;
            }

            const dadosPeca = {
                nome: novaPeca.nome,
                descricao: novaPeca.descricao,
                preco: parseFloat(novaPeca.preco || "0"),
                foto_url: urlsFinais
            };

            if (editandoId) {
                // ATUALIZAR
                const { error } = await supabase.from("catalogo").update(dadosPeca).eq("id", editandoId);
                if (error) throw error;
                toast.success("Modelo atualizado!");
            } else {
                // INSERIR NOVO
                if (urlsFinais.length === 0) throw new Error("Selecione uma foto");
                const { error } = await supabase.from("catalogo").insert([dadosPeca]);
                if (error) throw error;
                toast.success("Adicionado à vitrine!");
            }

            setModalAberto(false);
            resetForm();
            loadPecas();
        } catch (error) { toast.error("Erro ao salvar."); }
        finally { setSalvando(false); }
    };

    const resetForm = () => {
        setEditandoId(null);
        setNovaPeca({ nome: "", descricao: "", preco: "" });
        setArquivosFotos([]);
        setPreviewsUrls([]);
    };

    const abrirEdicao = (peca: Peca) => {
        setEditandoId(peca.id);
        setNovaPeca({ nome: peca.nome, descricao: peca.descricao, preco: peca.preco.toString() });
        setPreviewsUrls(peca.foto_url);
        setModalAberto(true);
    };

    const handleExcluir = async (id: string, nome: string, fotos: string[]) => {
        if (!confirm(`Excluir '${nome}'?`)) return;
        try {
            const nomesArquivos = fotos.map(url => url.split('/').pop()).filter(Boolean) as string[];
            if (nomesArquivos.length > 0) await supabase.storage.from("catalogo").remove(nomesArquivos);
            await supabase.from("catalogo").delete().eq("id", id);
            toast.success("Removido.");
            loadPecas();
        } catch (error) { toast.error("Erro ao excluir."); }
    };

    const mudarFoto = (pecaId: string, direcao: 'prox' | 'ant', total: number) => {
        setIndicesCarrossel(prev => {
            const atual = prev[pecaId] || 0;
            let novoIndice = direcao === 'prox' ? atual + 1 : atual - 1;
            if (novoIndice >= total) novoIndice = 0;
            if (novoIndice < 0) novoIndice = total - 1;
            return { ...prev, [pecaId]: novoIndice };
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            {isAdmin && !modoCliente && (
                <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                    <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                        <img src={logoImg} alt="Logo" className="h-14 w-auto rounded-lg" />
                        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="font-bold text-slate-600">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Gerenciar Ateliê
                        </Button>
                    </div>
                </header>
            )}

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                {/* TÍTULO COM ALLURA E MONTSERRAT */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
                    <div className="text-center md:text-left">
                        <h1 className="leading-tight flex flex-col md:flex-row md:items-baseline">
                            <span className="text-7xl md:text-8xl text-cyan-500" style={{ fontFamily: "'Allura', cursive", textTransform: 'none' }}>Fabbis</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="h-[2px] w-12 bg-cyan-200 hidden md:block"></div>
                            <p className="text-slate-500 font-bold tracking-[0.3em] text-lg md:text-xl uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Vitrine Exclusiva • Coleção 2026</p>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="flex gap-3">
                            <Button variant="outline" className="font-bold rounded-xl border-2" onClick={() => setModoCliente(!modoCliente)}>
                                {modoCliente ? <><Eye className="mr-2 h-4 w-4" /> MODO EDIÇÃO</> : <><EyeOff className="mr-2 h-4 w-4" /> VER COMO CLIENTE</>}
                            </Button>
                            {!modoCliente && <Button className="bg-slate-900 rounded-xl font-bold px-6" onClick={() => { resetForm(); setModalAberto(true); }}><Plus className="mr-2 h-4 w-4" /> NOVO MODELO</Button>}
                        </div>
                    )}
                </div>

                {/* GRID DE CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {pecas.map((peca) => {
                        const indiceAtual = indicesCarrossel[peca.id] || 0;
                        return (
                            <Card key={peca.id} className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem] flex flex-col group transition-all">
                                <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                                    <img src={peca.foto_url[indiceAtual]} alt={peca.nome} className="w-full h-full object-cover transition-all duration-700" />

                                    {peca.foto_url.length > 1 && (
                                        <>
                                            <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => mudarFoto(peca.id, 'ant', peca.foto_url.length)} className="bg-white/90 p-2 rounded-full shadow-lg"><ChevronLeft className="h-6 w-6 text-slate-800" /></button>
                                                <button onClick={() => mudarFoto(peca.id, 'prox', peca.foto_url.length)} className="bg-white/90 p-2 rounded-full shadow-lg"><ChevronRight className="h-6 w-6 text-slate-800" /></button>
                                            </div>
                                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                                                {peca.foto_url.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === indiceAtual ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />)}
                                            </div>
                                        </>
                                    )}

                                    {/* BOTÕES DE ADMIN NO CARD */}
                                    {isAdmin && !modoCliente && (
                                        <div className="absolute top-5 right-5 flex gap-2">
                                            <button onClick={() => abrirEdicao(peca)} className="bg-white text-cyan-600 p-2.5 rounded-full shadow-xl hover:bg-cyan-50 transition-colors"><Pencil className="h-5 w-5" /></button>
                                            <button onClick={() => handleExcluir(peca.id, peca.nome, peca.foto_url)} className="bg-red-500 text-white p-2.5 rounded-full shadow-xl hover:bg-red-600 transition-colors"><Trash2 className="h-5 w-5" /></button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-7">
                                    <h3 className="font-black text-2xl text-slate-900 mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>{peca.nome}</h3>
                                    <p className="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed">{peca.descricao || "Peça exclusiva Fabbis Ateliê."}</p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço</span>
                                            {/* Diminuído de text-2xl para text-lg */}
                                            <p className="text-lg font-black text-cyan-600">R$ {peca.preco.toFixed(2)}</p>
                                        </div>

                                        {modoCliente && (
                                            <Button
                                                /* h-9 deixa o botão mais baixinho, text-xs a letra menor e px-4 menos largo */
                                                className="bg-green-500 hover:bg-green-600 rounded-xl px-4 h-9 text-xs font-bold shadow-md transition-all"
                                                onClick={() => window.open(`https://wa.me/${SEU_TELEFONE}?text=${encodeURIComponent(`Olá Fabi! Gostei do modelo "${peca.nome}".`)}`, "_blank")}
                                            >
                                                {/* Ícone menor (h-4 w-4) para acompanhar o botão */}
                                                <MessageCircle className="mr-1.5 h-4 w-4" /> Encomendar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </main>

            {/* MODAL DE CADASTRO/EDIÇÃO */}
            <Dialog open={modalAberto} onOpenChange={(open) => { if(!open) resetForm(); setModalAberto(open); }}>
                <DialogContent className="max-w-md rounded-[2.5rem] bg-white border-none p-8">
                    <DialogHeader><DialogTitle className="font-black text-2xl text-slate-900">{editandoId ? "Editar Modelo" : "Novo Modelo"}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSalvar} className="space-y-5 mt-4">
                        <div onClick={() => inputFileRef.current?.click()} className="h-44 w-full border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors">
                            {previewsUrls.length > 0 ? (
                                <div className="flex gap-2 p-3 overflow-x-auto w-full">
                                    {previewsUrls.map((url, i) => <img key={i} src={url} className="h-32 w-24 object-cover rounded-xl shadow-md" />)}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400"><Camera className="mx-auto h-12 w-12 mb-2" /><p className="text-xs font-black uppercase tracking-tighter">Selecione as fotos</p></div>
                            )}
                            <input type="file" multiple accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFotos} />
                        </div>
                        <Input placeholder="Nome *" value={novaPeca.nome} onChange={e => setNovaPeca({...novaPeca, nome: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-none" />
                        <Input type="number" placeholder="Valor R$" value={novaPeca.preco} onChange={e => setNovaPeca({...novaPeca, preco: e.target.value})} className="h-12 rounded-xl font-bold bg-slate-50 border-none" />
                        <Input placeholder="Descrição" value={novaPeca.descricao} onChange={e => setNovaPeca({...novaPeca, descricao: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none" />
                        <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-xl" disabled={salvando}>{salvando ? "SALVANDO..." : editandoId ? "SALVAR ALTERAÇÕES" : "PUBLICAR NA VITRINE"}</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}