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
import {
    ArrowLeft,
    Plus,
    Trash2,
    Camera,
    Eye,
    EyeOff,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Sparkles
} from "lucide-react";
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

    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [arquivosFotos, setArquivosFotos] = useState<File[]>([]);
    const [previewsUrls, setPreviewsUrls] = useState<string[]>([]);
    const [indicesCarrossel, setIndicesCarrossel] = useState<{ [key: string]: number }>({});

    const inputFileRef = useRef<HTMLInputElement>(null);
    const [novaPeca, setNovaPeca] = useState({ nome: "", descricao: "", preco: "" });

    const SEU_TELEFONE = "55839XXXXXXXX"; // Substitua pelo seu WhatsApp real

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
        if (!novaPeca.nome) return toast.error("Dê um nome ao modelo!");

        setSalvando(true);
        try {
            let urlsFinais = editandoId ? previewsUrls : [];

            if (arquivosFotos.length > 0) {
                const novasUrls: string[] = [];
                for (const foto of arquivosFotos) {
                    let fotoComprimida = await comprimirImagem(foto);
                    const nomeArquivo = `cat-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
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
                const { error } = await supabase.from("catalogo").update(dadosPeca).eq("id", editandoId);
                if (error) throw error;
                toast.success("Modelo atualizado! ✨");
            } else {
                if (urlsFinais.length === 0) throw new Error("Adicione ao menos uma foto");
                const { error } = await supabase.from("catalogo").insert([dadosPeca]);
                if (error) throw error;
                toast.success("Peça incrível adicionada à vitrine!");
            }

            setModalAberto(false);
            resetForm();
            loadPecas();
        } catch (error: any) { toast.error(error.message || "Erro ao salvar."); }
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
        if (!confirm(`Deseja mesmo remover '${nome}' da vitrine?`)) return;
        try {
            const nomesArquivos = fotos.map(url => url.split('/').pop()).filter(Boolean) as string[];
            if (nomesArquivos.length > 0) await supabase.storage.from("catalogo").remove(nomesArquivos);
            await supabase.from("catalogo").delete().eq("id", id);
            toast.success("Removido com sucesso.");
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

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-widest">Organizando a Vitrine...</div>;

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-20 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            {/* HEADER ADMIN */}
            {isAdmin && !modoCliente && (
                <header className="bg-white border-b sticky top-0 z-50 shadow-sm px-6 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Logo" className="h-10 w-auto rounded-lg" />
                    <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="font-black text-slate-400 text-[10px] uppercase tracking-widest">
                        <ArrowLeft className="h-3 w-3 mr-2" /> Voltar ao Ateliê
                    </Button>
                </header>
            )}

            <main className="container mx-auto px-6 py-12 max-w-6xl">
                {/* TÍTULO DA VITRINE */}
                <div className="text-center mb-16 space-y-2">
                    <h1 className="text-8xl md:text-9xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Fabbis</h1>
                    <p className="text-slate-400 font-black tracking-[0.5em] text-xs uppercase -mt-4">Vitrine de Verão 2026</p>

                    {isAdmin && (
                        <div className="flex justify-center gap-4 pt-8">
                            <Button
                                variant="outline"
                                className="rounded-full border-slate-200 text-slate-500 font-bold text-[10px] tracking-widest uppercase px-6"
                                onClick={() => setModoCliente(!modoCliente)}
                            >
                                {modoCliente ? <><Eye className="mr-2 h-3 w-3" /> Modo Designer</> : <><EyeOff className="mr-2 h-3 w-3" /> Ver como Cliente</>}
                            </Button>
                            {!modoCliente && (
                                <Button className="bg-slate-900 rounded-full font-bold text-[10px] tracking-widest uppercase px-6" onClick={() => { resetForm(); setModalAberto(true); }}>
                                    <Plus className="mr-2 h-3 w-3" /> Novo Modelo
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* GRID DE MODELOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {pecas.map((peca) => {
                        const indiceAtual = indicesCarrossel[peca.id] || 0;
                        return (
                            <div key={peca.id} className="group relative">
                                <Card className="overflow-hidden border-none shadow-none bg-transparent flex flex-col">
                                    {/* IMAGEM COM EFEITO DE BOUTIQUE */}
                                    <div className="aspect-[3/4] bg-slate-100 rounded-[3rem] relative overflow-hidden shadow-2xl shadow-slate-200/50">
                                        <img
                                            src={peca.foto_url[indiceAtual]}
                                            alt={peca.nome}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />

                                        {/* CONTROLES DO CARROSSEL */}
                                        {peca.foto_url.length > 1 && (
                                            <>
                                                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => mudarFoto(peca.id, 'ant', peca.foto_url.length)} className="bg-white/80 backdrop-blur-md p-3 rounded-2xl"><ChevronLeft className="h-5 w-5 text-slate-800" /></button>
                                                    <button onClick={() => mudarFoto(peca.id, 'prox', peca.foto_url.length)} className="bg-white/80 backdrop-blur-md p-3 rounded-2xl"><ChevronRight className="h-5 w-5 text-slate-800" /></button>
                                                </div>
                                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                                                    {peca.foto_url.map((_, i) => (
                                                        <div key={i} className={`h-1 rounded-full transition-all ${i === indiceAtual ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {/* GESTÃO DESIGNER */}
                                        {isAdmin && !modoCliente && (
                                            <div className="absolute top-6 right-6 flex flex-col gap-2">
                                                <button onClick={() => abrirEdicao(peca)} className="bg-white text-slate-900 p-3 rounded-2xl shadow-xl hover:bg-cyan-500 hover:text-white transition-all"><Pencil className="h-4 w-4" /></button>
                                                <button onClick={() => handleExcluir(peca.id, peca.nome, peca.foto_url)} className="bg-white text-rose-500 p-3 rounded-2xl shadow-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        )}
                                    </div>

                                    {/* INFO DA PEÇA */}
                                    <div className="pt-8 px-2 text-center">
                                        <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tighter" style={{ fontFamily: "'Montserrat', sans-serif" }}>{peca.nome}</h3>
                                        <p className="text-slate-400 text-xs font-medium mt-2 line-clamp-2 px-4 italic">"{peca.descricao || "A essência do verão em cada detalhe."}"</p>

                                        <div className="mt-6 flex flex-col items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-emerald-500 font-black text-xl">R$ {peca.preco.toFixed(2)}</span>
                                            </div>

                                            {modoCliente && (
                                                <Button
                                                    className="bg-slate-900 hover:bg-cyan-600 rounded-full px-8 h-12 text-[10px] font-black tracking-[0.2em] uppercase shadow-lg transition-all active:scale-95"
                                                    onClick={() => window.open(`https://wa.me/${SEU_TELEFONE}?text=${encodeURIComponent(`Olá Fabi! Me apaixonei pelo modelo "${peca.nome}". Pode me passar mais detalhes?`)}`, "_blank")}
                                                >
                                                    <MessageCircle className="mr-2 h-4 w-4" /> Encomendar Modelo
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MODAL DE EDIÇÃO/CADASTRO */}
            <Dialog open={modalAberto} onOpenChange={(open) => { if(!open) resetForm(); setModalAberto(open); }}>
                <DialogContent className="max-w-lg rounded-[3.5rem] bg-white/90 backdrop-blur-2xl border-none p-10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-black text-2xl text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-cyan-500" />
                            {editandoId ? "Ajustar Detalhes" : "Novo Design"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSalvar} className="space-y-6 mt-6">
                        {/* UPLOAD DE FOTOS */}
                        <div
                            onClick={() => inputFileRef.current?.click()}
                            className="h-56 w-full border-4 border-dashed border-slate-100 bg-slate-50 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-50/50 hover:border-cyan-200 transition-all overflow-hidden"
                        >
                            {previewsUrls.length > 0 ? (
                                <div className="flex gap-3 p-4 overflow-x-auto w-full">
                                    {previewsUrls.map((url, i) => <img key={i} src={url} className="h-40 w-32 object-cover rounded-2xl shadow-lg border-2 border-white" />)}
                                </div>
                            ) : (
                                <div className="text-center text-slate-300">
                                    <Camera className="mx-auto h-12 w-12 mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Adicionar Fotos do Look</p>
                                </div>
                            )}
                            <input type="file" multiple accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFotos} />
                        </div>

                        <div className="space-y-4">
                            <Input placeholder="Nome da Peça" value={novaPeca.nome} onChange={e => setNovaPeca({...novaPeca, nome: e.target.value})} className="h-14 rounded-2xl font-bold bg-slate-100 border-none px-6 focus-visible:ring-cyan-500" />
                            <div className="relative">
                                <span className="absolute left-6 top-4 font-black text-slate-400">R$</span>
                                <Input type="number" step="0.01" placeholder="0,00" value={novaPeca.preco} onChange={e => setNovaPeca({...novaPeca, preco: e.target.value})} className="h-14 rounded-2xl font-black bg-slate-100 border-none pl-14 focus-visible:ring-emerald-500" />
                            </div>
                            <Input placeholder="Breve descrição ou inspiração..." value={novaPeca.descricao} onChange={e => setNovaPeca({...novaPeca, descricao: e.target.value})} className="h-14 rounded-2xl bg-slate-100 border-none px-6" />
                        </div>

                        <Button type="submit" className="w-full h-20 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all" disabled={salvando}>
                            {salvando ? "PROCESSANDO..." : editandoId ? "ATUALIZAR VITRINE" : "LANÇAR MODELO"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <footer className="text-center p-12">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Fabbis Beachwear</p>
            </footer>
        </div>
    );
}