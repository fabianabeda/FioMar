import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Save,
    Loader2,
    Camera,
    Scissors,
    Palette,
    Image as ImageIcon,
    Info,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

// Função para garantir que fotos pesadas não travem o sistema
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

export default function EditarPedido() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<any[]>([]);
    const [materiais, setMateriais] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fotoOriginal, setFotoOriginal] = useState<string | null>(null);
    const inputFileRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        cliente_id: "", produto: "Biquíni", tamanho: "M", cor_frente: "", cor_verso: "", cor_roletes: "", cor_linha: "",
        modelo_cima: "", tem_bojo: "false", modelo_baixo: "", tipo_lateral_baixo: "", data_entrega: "", valor: "", observacoes: ""
    });

    useEffect(() => { carregarDadosBase(); }, [id]);

    const carregarDadosBase = async () => {
        setLoading(true);
        try {
            const [clientesRes, materiaisRes, pedidoRes] = await Promise.all([
                supabase.from("clientes").select("id, nome_completo").order("nome_completo"),
                supabase.from("materiais").select("*").order("created_at", { ascending: false }),
                supabase.from("pedidos").select("*").eq("id", id).single()
            ]);

            if (pedidoRes.error) throw pedidoRes.error;

            setClientes(clientesRes.data || []);
            setMateriais(materiaisRes.data || []);

            const pedido = pedidoRes.data;
            if (pedido) {
                setFormData({
                    cliente_id: pedido.cliente_id || "",
                    produto: pedido.produto || "Biquíni",
                    tamanho: pedido.tamanho || "M",
                    cor_frente: pedido.cor_frente || "",
                    cor_verso: pedido.cor_verso || "",
                    cor_roletes: pedido.cor_roletes || "",
                    cor_linha: pedido.cor_linha || "",
                    modelo_cima: pedido.modelo_cima || "",
                    tem_bojo: pedido.tem_bojo ? "true" : "false",
                    modelo_baixo: pedido.modelo_baixo || "",
                    tipo_lateral_baixo: pedido.tipo_lateral_baixo || "",
                    data_entrega: pedido.data_entrega || "",
                    valor: pedido.valor?.toString() || "",
                    observacoes: pedido.observacoes || "",
                });

                if (pedido.foto_url) {
                    setFotoOriginal(pedido.foto_url);
                    setPreviewUrl(pedido.foto_url);
                }
            }
        } catch (error) { toast.error("Erro ao carregar o pedido."); } finally { setLoading(false); }
    };

    const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setArquivoFoto(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        let urlDaFotoFinal = fotoOriginal;

        try {
            // Se houver nova foto, faz upload e limpa a antiga
            if (arquivoFoto) {
                const fotoParaEnviar = await comprimirImagem(arquivoFoto).catch(() => arquivoFoto);
                const nomeArquivo = `edit-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

                const { error: uploadError } = await supabase.storage.from("pedidos").upload(nomeArquivo, fotoParaEnviar);
                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("pedidos").getPublicUrl(nomeArquivo);
                urlDaFotoFinal = data.publicUrl;

                // Remove a foto antiga para não acumular lixo
                if (fotoOriginal) {
                    const nomeAntigo = fotoOriginal.split('/').pop();
                    if (nomeAntigo) await supabase.storage.from("pedidos").remove([nomeAntigo]);
                }
            }

            const { error } = await supabase.from("pedidos").update({
                ...formData,
                tem_bojo: formData.tem_bojo === "true",
                valor: parseFloat(formData.valor || "0"),
                foto_url: urlDaFotoFinal
            }).eq("id", id);

            if (error) throw error;
            toast.success("Ajustes realizados com sucesso! ✨");
            navigate(-1);
        } catch (error) { toast.error("Erro ao salvar alterações."); } finally { setSaving(false); }
    };

    const RenderSeletorVisual = ({ tipo, label, campoDestino, icon: Icon, colorClass }: any) => {
        const opcoes = materiais.filter(m => m.categoria?.toLowerCase() === tipo.toLowerCase());
        const valorAtual = formData[campoDestino as keyof typeof formData] as string;

        return (
            <div className="bg-white p-5 rounded-[2rem] border-none shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest">{label}</Label>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
                    {opcoes.map(m => (
                        <div
                            key={m.id}
                            onClick={() => setFormData({...formData, [campoDestino]: m.nome})}
                            className="flex flex-col items-center gap-2 cursor-pointer min-w-[80px]"
                        >
                            <div className={`w-16 h-16 rounded-[1.2rem] overflow-hidden border-4 transition-all ${valorAtual === m.nome ? 'border-cyan-500 scale-110 shadow-lg' : 'border-slate-50 opacity-40'}`}>
                                {m.foto_url ? <img src={m.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-slate-300" /></div>}
                            </div>
                            <span className="text-[9px] font-black text-center w-full truncate text-slate-500 uppercase">{m.nome}</span>
                        </div>
                    ))}
                </div>
                <Input
                    placeholder="Ou especifique manualmente..."
                    value={valorAtual}
                    onChange={(e) => setFormData({...formData, [campoDestino]: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-600"
                />
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Loader2 className="animate-spin h-10 w-10 text-cyan-500 mx-auto mb-4" />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Buscando Detalhes...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}</style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </Button>
                        <img src={logoImg} alt="Fabbis" className="h-10 w-auto rounded-lg" />
                    </div>
                    <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em] bg-cyan-50 px-4 py-2 rounded-full">
                        Pedido #{id?.substring(0, 5)}
                    </span>
                </div>
            </header>

            <main className="container mx-auto px-4 py-10 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="leading-tight flex flex-col items-center">
                        <span className="text-7xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Ajustar</span>
                        <span className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em] -mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>A Encomenda</span>
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* INFORMAÇÕES BÁSICAS */}
                    <Card className="p-8 rounded-[3rem] border-none shadow-xl shadow-slate-100 space-y-6 bg-white">
                        <div className="space-y-3">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Cliente Solicitante</Label>
                            <Select value={formData.cliente_id} onValueChange={(v) => setFormData({...formData, cliente_id: v})}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700">
                                    <SelectValue placeholder="Selecione a cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Peça</Label>
                                <Select value={formData.produto} onValueChange={(v) => setFormData({...formData, produto: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Biquíni">Biquíni</SelectItem>
                                        <SelectItem value="Maiô">Maiô</SelectItem>
                                        <SelectItem value="Saída de Praia">Saída de Praia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Tamanho</Label>
                                <Select value={formData.tamanho} onValueChange={(v) => setFormData({...formData, tamanho: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['PP', 'P', 'M', 'G', 'GG'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* SELETORES VISUAIS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <RenderSeletorVisual tipo="Tecido" label="Cor Frente" campoDestino="cor_frente" icon={Scissors} colorClass="text-pink-500" />
                        <RenderSeletorVisual tipo="Tecido" label="Cor Verso" campoDestino="cor_verso" icon={Scissors} colorClass="text-pink-500" />
                        <RenderSeletorVisual tipo="Linha" label="Linha Crochê" campoDestino="cor_linha" icon={Palette} colorClass="text-cyan-500" />
                        <RenderSeletorVisual tipo="Bojo" label="Acessórios" campoDestino="cor_roletes" icon={Sparkles} colorClass="text-amber-500" />
                    </div>

                    {/* DETALHES TÉCNICOS */}
                    <Card className="p-8 rounded-[3rem] border-none shadow-xl shadow-slate-100 space-y-8 bg-white overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-bl-[5rem] -z-0 opacity-50" />

                         <div className="relative z-10 space-y-6">
                            <h3 className="font-black text-slate-800 text-xs uppercase tracking-[0.2em] mb-4">Especificações de Modelagem</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 p-6 bg-slate-50 rounded-[2rem]">
                                    <div className="space-y-2">
                                        <Label className="font-black text-cyan-600 text-[9px] uppercase tracking-widest">Modelo Superior</Label>
                                        <Input value={formData.modelo_cima} onChange={(e) => setFormData({...formData, modelo_cima: e.target.value})} className="h-12 bg-white border-none rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-cyan-600 text-[9px] uppercase tracking-widest">Contém Bojo?</Label>
                                        <Select value={formData.tem_bojo} onValueChange={(v) => setFormData({...formData, tem_bojo: v})}>
                                            <SelectTrigger className="h-12 bg-white border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4 p-6 bg-pink-50/50 rounded-[2rem]">
                                    <div className="space-y-2">
                                        <Label className="font-black text-pink-600 text-[9px] uppercase tracking-widest">Modelo Inferior</Label>
                                        <Input value={formData.modelo_baixo} onChange={(e) => setFormData({...formData, modelo_baixo: e.target.value})} className="h-12 bg-white border-none rounded-xl font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-black text-pink-600 text-[9px] uppercase tracking-widest">Tipo Lateral</Label>
                                        <Input value={formData.tipo_lateral_baixo} onChange={(e) => setFormData({...formData, tipo_lateral_baixo: e.target.value})} className="h-12 bg-white border-none rounded-xl font-bold" />
                                    </div>
                                </div>
                            </div>
                         </div>
                    </Card>

                    {/* FOTO E FECHAMENTO */}
                    <Card className="p-8 rounded-[3rem] border-none shadow-xl shadow-slate-100 space-y-8 bg-white">
                        <div className="space-y-4">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Imagem de Referência</Label>
                            <div
                                onClick={() => inputFileRef.current?.click()}
                                className="h-64 w-full border-4 border-dashed border-slate-50 bg-slate-50/50 rounded-[2.5rem] flex items-center justify-center cursor-pointer hover:bg-cyan-50/30 transition-all overflow-hidden relative group"
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl flex items-center gap-2">
                                                <Camera className="text-white h-5 w-5" />
                                                <span className="text-white font-black text-[10px] uppercase">Alterar Foto</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <Camera className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                        <p className="font-black text-slate-300 text-[10px] uppercase">Anexar Inspiração</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFoto} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="font-black text-rose-400 uppercase text-[10px] tracking-widest ml-1">Nova Data de Entrega</Label>
                                <Input type="date" value={formData.data_entrega} onChange={(e) => setFormData({...formData, data_entrega: e.target.value})} required className="h-14 rounded-2xl bg-rose-50 border-none font-black text-rose-700 text-lg" />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-emerald-400 uppercase text-[10px] tracking-widest ml-1">Valor Final</Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-4 font-black text-emerald-600/50">R$</span>
                                    <Input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} required className="h-14 rounded-2xl bg-emerald-50 border-none font-black text-emerald-700 text-xl pl-12" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Notas Internas</Label>
                            <Input value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-medium text-slate-600" />
                        </div>
                    </Card>

                    {/* BOTÕES */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="flex-1 h-20 bg-slate-900 hover:bg-black text-white font-black rounded-[2rem] text-lg uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                        >
                            {saving ? <Loader2 className="animate-spin h-6 w-6" /> : <div className="flex items-center gap-3"><Save className="h-5 w-5" /> <span>Salvar Ajustes</span></div>}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-20 px-10 font-black text-slate-400 uppercase tracking-widest text-xs"
                            onClick={() => navigate(-1)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}