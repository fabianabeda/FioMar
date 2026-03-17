import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
    Camera,
    Scissors,
    Palette,
    Image as ImageIcon,
    Info,
    Sparkles,
    Ruler,
    DollarSign,
    Calendar
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

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

export default function NovoPedido() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<any[]>([]);
    const [materiais, setMateriais] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputFileRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        cliente_id: "", produto: "Biquíni", tamanho: "M", cor_frente: "", cor_verso: "", cor_roletes: "", cor_linha: "",
        modelo_cima: "", tem_bojo: "false", modelo_baixo: "", tipo_lateral_baixo: "", data_entrega: "", valor: "", observacoes: ""
    });

    useEffect(() => { carregarDadosBase(); }, []);

    const carregarDadosBase = async () => {
        setLoading(true);
        try {
            const [clientesRes, materiaisRes] = await Promise.all([
                supabase.from("clientes").select("id, nome_completo").order("nome_completo"),
                supabase.from("materiais").select("*").order("created_at", { ascending: false })
            ]);
            if (clientesRes.error) throw clientesRes.error;
            if (materiaisRes.error) throw materiaisRes.error;
            setClientes(clientesRes.data || []); setMateriais(materiaisRes.data || []);
        } catch (error) { toast.error("Erro ao carregar dados."); } finally { setLoading(false); }
    };

    const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setArquivoFoto(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.cliente_id) return toast.error("Selecione uma cliente.");

        setSalvando(true);
        let urlDaFotoSalva = null;

        try {
            if (arquivoFoto) {
                toast.info("A anexar referência...", { duration: 3000 });
                let fotoParaEnviar = arquivoFoto;
                try { fotoParaEnviar = await comprimirImagem(arquivoFoto); } catch (e) {}

                const nomeArquivo = `${Math.random().toString(36).substring(2)}.jpg`;
                const { error: uploadError } = await supabase.storage.from("pedidos").upload(nomeArquivo, fotoParaEnviar);
                if (!uploadError) {
                    const { data } = supabase.storage.from("pedidos").getPublicUrl(nomeArquivo);
                    urlDaFotoSalva = data.publicUrl;
                }
            }

            const { error } = await supabase.from("pedidos").insert([{
                ...formData, tem_bojo: formData.tem_bojo === "true", valor: parseFloat(formData.valor || "0"), foto_url: urlDaFotoSalva, status: "pendente"
            }]);

            if (error) throw error;
            toast.success("Pedido criado com sucesso! ✨");
            navigate("/pedidos");
        } catch (error) { toast.error("Erro ao guardar."); } finally { setSalvando(false); }
    };

    const RenderSeletorVisual = ({ tipo, label, campoDestino, icon: Icon, colorClass }: any) => {
        const opcoes = materiais.filter(m => m.tipo === tipo);
        const valorAtual = formData[campoDestino as keyof typeof formData] as string;

        return (
            <div className="bg-white p-6 rounded-[2rem] border-none shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${colorClass.replace('text', 'bg').replace('500', '50')}`}>
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                    </div>
                    <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest">{label}</Label>
                </div>

                {opcoes.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {opcoes.map(m => (
                            <div
                                key={m.id}
                                onClick={() => setFormData({...formData, [campoDestino]: m.nome})}
                                className={`flex flex-col items-center gap-2 cursor-pointer min-w-[80px] transition-all ${valorAtual === m.nome ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                            >
                                <div className={`w-16 h-16 rounded-2xl overflow-hidden border-4 ${valorAtual === m.nome ? 'border-cyan-500 shadow-lg shadow-cyan-100' : 'border-slate-100'}`}>
                                    {m.foto_url ? (
                                        <img src={m.foto_url} className="w-full h-full object-cover" alt={m.nome} />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-slate-200" /></div>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-center w-full truncate text-slate-600 uppercase tracking-tighter">{m.nome}</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-[10px] text-slate-300 font-bold uppercase italic">Nenhum {label.toLowerCase()} cadastrado.</p>}

                <Input
                    placeholder={`Ou digite a cor...`}
                    value={valorAtual}
                    onChange={(e) => setFormData({...formData, [campoDestino]: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold text-slate-700"
                />
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center font-black text-cyan-600 uppercase tracking-widest">
            Preparando ateliê...
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg" />
                    <Button variant="ghost" size="sm" onClick={() => navigate("/pedidos")} className="font-bold text-slate-400">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Cancelar
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* TÍTULO */}
                <div className="text-center mb-10">
                    <h1 className="leading-tight flex flex-col items-center">
                        <span className="text-7xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Criar</span>
                        <span className="text-3xl font-black text-slate-400 uppercase tracking-[0.2em] -mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Novo Pedido</span>
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* SEÇÃO 1: CLIENTE E PRODUTO */}
                    <Card className="p-8 rounded-[2.5rem] border-none shadow-md space-y-6">
                        <div className="space-y-3">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">Cliente *</Label>
                            {clientes.length > 0 ? (
                                <Select value={formData.cliente_id} onValueChange={(v) => setFormData({...formData, cliente_id: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-700 px-6">
                                        <SelectValue placeholder="Escolha a cliente sortuda..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        {clientes.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.nome_completo}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div onClick={() => navigate("/clientes/novo")} className="p-4 bg-amber-50 text-amber-600 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border border-dashed border-amber-200">
                                    <Plus className="h-4 w-4" /> Cadastre uma cliente primeiro
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">O que vamos fazer?</Label>
                                <Select value={formData.produto} onValueChange={(v) => setFormData({...formData, produto: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-700 px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="Biquíni">Biquíni</SelectItem>
                                        <SelectItem value="Maiô">Maiô</SelectItem>
                                        <SelectItem value="Saída">Saída de Praia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] ml-1">Tamanho</Label>
                                <Select value={formData.tamanho} onValueChange={(v) => setFormData({...formData, tamanho: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-700 px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {["PP", "P", "M", "G", "GG"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {/* SEÇÃO 2: MATERIAIS VISUAIS */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 pl-2">
                            <Sparkles className="h-5 w-5 text-cyan-500" />
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Estilo & Cores</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <RenderSeletorVisual tipo="tecido" label="Tecido Frente" campoDestino="cor_frente" icon={Scissors} colorClass="text-pink-500" />
                            <RenderSeletorVisual tipo="tecido" label="Tecido Verso" campoDestino="cor_verso" icon={Scissors} colorClass="text-pink-500" />
                            <RenderSeletorVisual tipo="linha" label="Linha Crochê" campoDestino="cor_linha" icon={Palette} colorClass="text-cyan-500" />
                            <RenderSeletorVisual tipo="rolete" label="Roletes" campoDestino="cor_roletes" icon={ImageIcon} colorClass="text-purple-500" />
                        </div>
                    </div>

                    {/* SEÇÃO 3: MODELAGEM */}
                    <Card className="p-8 rounded-[2.5rem] border-none shadow-md space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                            <Ruler className="h-5 w-5 text-blue-500" />
                            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Ficha Técnica</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 p-6 bg-blue-50/30 rounded-[2rem] border border-blue-50">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Parte Superior</p>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Modelo do Top</Label>
                                    <Input placeholder="Ex: Cortininha" value={formData.modelo_cima} onChange={(e) => setFormData({...formData, modelo_cima: e.target.value})} className="h-12 bg-white rounded-xl border-none shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Leva Bojo?</Label>
                                    <Select value={formData.tem_bojo} onValueChange={(v) => setFormData({...formData, tem_bojo: v})}>
                                        <SelectTrigger className="h-12 bg-white rounded-xl border-none shadow-sm font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 p-6 bg-purple-50/30 rounded-[2rem] border border-purple-50">
                                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Parte Inferior</p>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Modelo Calcinha</Label>
                                    <Input placeholder="Ex: Asa Delta" value={formData.modelo_baixo} onChange={(e) => setFormData({...formData, modelo_baixo: e.target.value})} className="h-12 bg-white rounded-xl border-none shadow-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase">Tipo de Lateral</Label>
                                    <Input placeholder="Ex: Fio Dental" value={formData.tipo_lateral_baixo} onChange={(e) => setFormData({...formData, tipo_lateral_baixo: e.target.value})} className="h-12 bg-white rounded-xl border-none shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* SEÇÃO 4: REFERÊNCIA E PRAZO */}
                    <Card className="p-8 rounded-[2.5rem] border-none shadow-md space-y-6">
                        <div className="space-y-3">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Foto de Referência</Label>
                            <div
                                onClick={() => inputFileRef.current?.click()}
                                className="h-48 w-full border-4 border-dashed border-cyan-100 bg-slate-50/50 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-cyan-50/50 hover:border-cyan-300 relative overflow-hidden"
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Camera className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                                        <p className="font-black text-cyan-600 text-[10px] uppercase tracking-widest">Anexar Inspiração</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFoto} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="font-black text-amber-500 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> Data de Entrega *
                                </Label>
                                <Input type="date" value={formData.data_entrega} onChange={(e) => setFormData({...formData, data_entrega: e.target.value})} required className="h-14 rounded-2xl bg-amber-50/50 border-none font-black text-slate-700" />
                            </div>
                            <div className="space-y-3">
                                <Label className="font-black text-green-500 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                    <DollarSign className="h-3 w-3" /> Valor Final *
                                </Label>
                                <Input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} required className="h-14 rounded-2xl bg-green-50/50 border-none font-black text-green-700 text-xl" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-black text-slate-400 uppercase text-[10px] tracking-widest ml-1">Observações da Cliente</Label>
                            <Input placeholder="Ex: Quer a alça um pouco mais comprida..." value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                    </Card>

                    {/* BOTÃO FINAL */}
                    <Button
                        type="submit"
                        className="w-full h-20 bg-slate-900 hover:bg-black text-white font-black rounded-[2rem] text-xl uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                        disabled={salvando}
                    >
                        {salvando ? "Salvando na agenda..." : "Confirmar Pedido"}
                        {!salvando && <Save className="h-6 w-6 ml-4" />}
                    </Button>
                </form>
            </main>
        </div>
    );
}