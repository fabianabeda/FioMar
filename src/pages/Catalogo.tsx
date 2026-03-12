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
import { ArrowLeft, Plus, Trash2, Camera, Eye, EyeOff, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

interface Peca { id: string; nome: string; descricao: string; preco: number; foto_url: string; }

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
    const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputFileRef = useRef<HTMLInputElement>(null);
    const [novaPeca, setNovaPeca] = useState({ nome: "", descricao: "", preco: "" });

    // Configuração do seu WhatsApp
    const SEU_TELEFONE = "55XXXXXXXXXXX"; // COLOQUE SEU DDD E NÚMERO AQUI (SÓ NÚMEROS)

    useEffect(() => {
        loadPecas();
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsAdmin(true);
            setModoCliente(false); // Se for a Fabi, abre em modo edição
        }
    };

    const loadPecas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from("catalogo").select("*").order("created_at", { ascending: false });
            if (error) throw error;
            setPecas(data || []);
        } catch (error) { toast.error("Erro ao carregar vitrine."); }
        finally { setLoading(false); }
    };

    const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setArquivoFoto(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaPeca.nome || !arquivoFoto) return toast.error("Nome e foto são obrigatórios!");

        setSalvando(true);
        try {
            let fotoParaEnviar = await comprimirImagem(arquivoFoto);
            const nomeArquivo = `${Math.random().toString(36).substring(2)}.jpg`;
            await supabase.storage.from("catalogo").upload(nomeArquivo, fotoParaEnviar);
            const { data: publicUrlData } = supabase.storage.from("catalogo").getPublicUrl(nomeArquivo);

            const { error } = await supabase.from("catalogo").insert([{
                nome: novaPeca.nome,
                descricao: novaPeca.descricao,
                preco: parseFloat(novaPeca.preco || "0"),
                foto_url: publicUrlData.publicUrl
            }]);

            if (error) throw error;
            toast.success("Adicionado à vitrine!");
            setModalAberto(false);
            setNovaPeca({ nome: "", descricao: "", preco: "" });
            setArquivoFoto(null); setPreviewUrl(null);
            loadPecas();
        } catch (error) { toast.error("Erro ao guardar."); }
        finally { setSalvando(false); }
    };

    const handleExcluir = async (id: string, nome: string, fotoUrl: string) => {
        if (!confirm(`Excluir '${nome}'?`)) return;
        try {
            if (fotoUrl) {
                const nomeArquivo = fotoUrl.split('/').pop();
                if (nomeArquivo) await supabase.storage.from("catalogo").remove([nomeArquivo]);
            }
            await supabase.from("catalogo").delete().eq("id", id);
            toast.success("Peça removida.");
            loadPecas();
        } catch (error) { toast.error("Erro ao excluir."); }
    };

    const handleWhatsApp = (nome: string) => {
        const mensagem = encodeURIComponent(`Olá Fabi! Gostei desse biquíni do catálogo: ${nome}. Está disponível?`);
        window.open(`https://wa.me/${SEU_TELEFONE}?text=${mensagem}`, "_blank");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-cyan-700">A carregar...</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-12">
            {/* Header: Só aparece para a Admin logada */}
            {isAdmin && !modoCliente && (
                <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                    <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                        <img src={logoImg} alt="Logo" className="h-14 w-auto cursor-pointer" onClick={() => navigate("/")} />
                        <Button variant="ghost" size="sm" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 mr-1" /> Painel Admin</Button>
                    </div>
                </header>
            )}

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Vitrine Fabbis</h1>
                        <p className="text-slate-500 font-medium">Catálogo de Biquínis</p>
                    </div>

                    {isAdmin && (
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button variant="outline" className={`flex-1 md:flex-none border-2 font-bold h-12 rounded-xl ${modoCliente ? 'border-cyan-500 text-cyan-600 bg-cyan-50' : ''}`} onClick={() => setModoCliente(!modoCliente)}>
                                {modoCliente ? <><Eye className="h-5 w-5 mr-2" /> VER COMO ADMIN</> : <><EyeOff className="h-5 w-5 mr-2" /> VER COMO CLIENTE</>}
                            </Button>
                            {!modoCliente && <Button className="flex-1 md:flex-none bg-slate-900 text-white font-bold h-12 px-6 rounded-xl" onClick={() => setModalAberto(true)}><Plus className="h-5 w-5 mr-2" /> NOVO MODELO</Button>}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pecas.map((peca) => (
                        <Card key={peca.id} className="overflow-hidden border-none shadow-xl bg-white group rounded-[2rem] relative flex flex-col">
                            <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                                {peca.foto_url && <img src={peca.foto_url} alt={peca.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}

                                {/* Botão de excluir só para admin em modo edição */}
                                {isAdmin && !modoCliente && (
                                    <button onClick={() => handleExcluir(peca.id, peca.nome, peca.foto_url)} className="absolute top-4 right-4 bg-white/90 p-3 rounded-full text-red-500 shadow-lg hover:scale-110"><Trash2 className="h-5 w-5" /></button>
                                )}
                            </div>

                            <div className="p-6 flex flex-col flex-grow justify-between bg-white z-10">
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 mb-1">{peca.nome}</h3>
                                    {peca.descricao && <p className="text-slate-500 text-sm line-clamp-2">{peca.descricao}</p>}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <p className="text-2xl font-black text-cyan-600">R$ {peca.preco.toFixed(2)}</p>

                                    {/* Botão de WhatsApp para a cliente */}
                                    {modoCliente && (
                                        <Button
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-600 text-white rounded-full px-4"
                                            onClick={() => handleWhatsApp(peca.nome)}
                                        >
                                            <MessageCircle className="h-4 w-4 mr-1" /> Encomendar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Modal de Cadastro */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="max-w-md p-6 bg-white rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-black mb-2">Adicionar à Vitrine</DialogTitle></DialogHeader>
                    <form onSubmit={handleSalvar} className="space-y-5">
                        <div onClick={() => inputFileRef.current?.click()} className="h-64 w-full border-2 border-dashed border-slate-200 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative">
                            {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <div className="text-center"><Camera className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="font-bold text-slate-600 text-sm">Adicionar Foto do Biquíni</p></div>}
                            <input type="file" accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFoto} />
                        </div>
                        <Input placeholder="Nome do Modelo *" value={novaPeca.nome} onChange={e => setNovaPeca({...novaPeca, nome: e.target.value})} className="h-12 rounded-xl bg-slate-50 font-bold" />
                        <Input type="number" step="0.01" placeholder="Preço R$" value={novaPeca.preco} onChange={e => setNovaPeca({...novaPeca, preco: e.target.value})} className="h-12 rounded-xl bg-slate-50 font-bold" />
                        <Input placeholder="Detalhes (Opcional)" value={novaPeca.descricao} onChange={e => setNovaPeca({...novaPeca, descricao: e.target.value})} className="h-12 rounded-xl bg-slate-50" />
                        <Button type="submit" className="w-full h-14 bg-slate-900 text-white font-black rounded-xl text-lg" disabled={salvando}>{salvando ? "A ENVIAR..." : "SALVAR NA VITRINE"}</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}