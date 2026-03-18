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
    Camera,
    Scissors,
    Palette,
    Image as ImageIcon,
    Sparkles,
    Ruler,
    DollarSign,
    Calendar,
    Plus,
    Layers,
    Loader2
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
        cliente_id: "", produto: "Biquíni", tamanho: "M",
        cor_frente: "", cor_verso: "", cor_roletes: "", cor_linha: "",
        modelo_cima: "", tem_bojo: "false", modelo_baixo: "",
        tipo_lateral_baixo: "", data_entrega: "", valor: "", observacoes: ""
    });

    useEffect(() => { carregarDadosBase(); }, []);

    const carregarDadosBase = async () => {
        setLoading(true);
        try {
            const [clientesRes, materiaisRes] = await Promise.all([
                supabase.from("clientes").select("id, nome_completo, telefone").order("nome_completo"),
                supabase.from("materiais").select("*").order("nome", { ascending: true })
            ]);
            setClientes(clientesRes.data || []);
            setMateriais(materiaisRes.data || []);
        } catch (error) {
            toast.error("Erro ao carregar dados do ateliê.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelecionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setArquivoFoto(e.target.files[0]);
            setPreviewUrl(URL.createObjectURL(e.target.files[0]));
        }
    };

    const copiarFrenteParaRolete = () => {
        if (formData.cor_frente) {
            setFormData(prev => ({ ...prev, cor_roletes: prev.cor_frente }));
            toast.success("Rolete igual ao tecido da frente! ✨");
        } else {
            toast.error("Escolha o tecido da frente primeiro.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.cliente_id) return toast.error("Selecione uma cliente.");

        setSalvando(true);
        let urlDaFotoSalva = null;

        try {
            if (arquivoFoto) {
                let fotoParaEnviar = arquivoFoto;
                try { fotoParaEnviar = await comprimirImagem(arquivoFoto); } catch (e) {}
                const nomeArquivo = `ref-${Date.now()}.jpg`;
                const { error: uploadError } = await supabase.storage.from("pedidos").upload(nomeArquivo, fotoParaEnviar);
                if (!uploadError) {
                    const { data } = supabase.storage.from("pedidos").getPublicUrl(nomeArquivo);
                    urlDaFotoSalva = data.publicUrl;
                }
            }

            const { error } = await supabase.from("pedidos").insert([{
                ...formData,
                tem_bojo: formData.tem_bojo === "true",
                valor: parseFloat(formData.valor || "0"),
                foto_url: urlDaFotoSalva,
                status: "realizados" // <-- AQUI: Nasce com o status correto!
            }]);

            if (error) throw error;

            const clienteInfo = clientes.find(c => c.id === formData.cliente_id);
            if (clienteInfo?.telefone) {
                const cleanPhone = clienteInfo.telefone.replace(/\D/g, "");
                const nomeCliente = clienteInfo.nome_completo.split(' ')[0];
                const dataFormatada = formData.data_entrega.split('-').reverse().join('/');

                const mensagem = `Olá, ${nomeCliente}! ✨%0A%0A` +
                    `*CONFIRMAÇÃO DE PEDIDO - FABBIS* 👙%0A%0A` +
                    `*Peça:* ${formData.produto} (Tam: ${formData.tamanho})%0A%0A` +
                    `*DESIGN & CORES:*%0A` +
                    `- Tecido Principal: ${formData.cor_frente}%0A` +
                    `${formData.cor_verso ? "- Tecido Verso: " + formData.cor_verso + "%0A" : ""}` +
                    `- Cor dos Roletes: ${formData.cor_roletes || formData.cor_frente}%0A` +
                    `- Linha Crochê: ${formData.cor_linha || "Padrão"}%0A%0A` +
                    `*MODELAGEM:*%0A` +
                    `- Top: ${formData.modelo_cima} ${formData.tem_bojo === "true" ? "(C/ Bojo)" : "(S/ Bojo)"}%0A` +
                    `- Calcinha: ${formData.modelo_baixo} (${formData.tipo_lateral_baixo})%0A%0A` +
                    `📅 *Entrega prevista:* ${dataFormatada}%0A` +
                    `💰 *Valor Total:* R$ ${parseFloat(formData.valor).toFixed(2)}%0A%0A` +
                    `Tudo certinho? Se sim, já vou dar início à produção da sua peça exclusiva! ✨💖`;

                window.open(`https://wa.me/55${cleanPhone}?text=${mensagem}`, "_blank");
            }

            toast.success("Pedido registrado e enviado para o Whats! 👙");
            navigate("/pedidos");
        } catch (error) {
            toast.error("Erro ao salvar pedido.");
        } finally {
            setSalvando(false);
        }
    };

    const RenderSeletorVisual = ({ tipo, label, campoDestino, icon: Icon, colorClass, showCopy }: any) => {
        const filtroTipo = tipo === "rolete" ? "tecido" : tipo;
        const opcoes = materiais.filter(m => m.tipo === filtroTipo);
        const valorAtual = formData[campoDestino as keyof typeof formData] as string;

        return (
            <div className="bg-white p-5 rounded-[2rem] border-none shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                        <Label className="font-black text-slate-400 uppercase text-[9px] tracking-widest">{label}</Label>
                    </div>
                    {showCopy && (
                        <button type="button" onClick={copiarFrenteParaRolete} className="text-[8px] font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full uppercase hover:bg-cyan-100 transition-colors">Igual à frente</button>
                    )}
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {opcoes.map(m => (
                        <div
                            key={m.id}
                            onClick={() => setFormData({...formData, [campoDestino]: m.nome})}
                            className={`flex flex-col items-center gap-2 cursor-pointer min-w-[70px] transition-all ${valorAtual === m.nome ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl overflow-hidden border-4 ${valorAtual === m.nome ? 'border-cyan-500 shadow-md' : 'border-slate-50'}`}>
                                {m.foto_url ? <img src={m.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-slate-200" /></div>}
                            </div>
                            <span className="text-[8px] font-black text-center w-full truncate text-slate-500 uppercase">{m.nome}</span>
                        </div>
                    ))}
                </div>
                <Input placeholder={`Cor do ${label.toLowerCase()}...`} value={valorAtual} onChange={(e) => setFormData({...formData, [campoDestino]: e.target.value})} className="h-10 rounded-xl bg-slate-50 border-none font-bold text-slate-700 text-xs" />
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-[#06B6D4] uppercase tracking-widest">Preparando Ficha...</div>;

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}</style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-10 w-auto rounded-lg" />
                    <Button variant="ghost" size="sm" onClick={() => navigate("/pedidos")} className="font-bold text-slate-400"><ArrowLeft className="h-4 w-4 mr-2" /> Cancelar</Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="leading-tight"><span className="text-7xl text-[#06B6D4]" style={{fontFamily: 'Allura'}}>Criar</span><span className="block text-2xl font-black text-slate-400 uppercase tracking-[0.2em] -mt-4" style={{fontFamily: 'Montserrat'}}>Novo Pedido</span></h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card className="p-8 rounded-[2.5rem] border-none shadow-sm space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="font-black text-slate-300 uppercase text-[9px] tracking-widest ml-1">Cliente *</Label>
                            <Select value={formData.cliente_id} onValueChange={(v) => setFormData({...formData, cliente_id: v})}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-700 px-6"><SelectValue placeholder="Selecione a cliente..." /></SelectTrigger>
                                <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.nome_completo}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-black text-slate-300 uppercase text-[9px] tracking-widest">Produto</Label>
                                <Select value={formData.produto} onValueChange={(v) => setFormData({...formData, produto: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Biquíni">Biquíni</SelectItem><SelectItem value="Maiô">Maiô</SelectItem><SelectItem value="Saída">Saída</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-slate-300 uppercase text-[9px] tracking-widest">Tamanho</Label>
                                <Select value={formData.tamanho} onValueChange={(v) => setFormData({...formData, tamanho: v})}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent>{["PP", "P", "M", "G", "GG"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RenderSeletorVisual tipo="tecido" label="Tecido Frente" campoDestino="cor_frente" icon={Scissors} colorClass="text-pink-500" />
                        <RenderSeletorVisual tipo="tecido" label="Tecido Verso" campoDestino="cor_verso" icon={Scissors} colorClass="text-blue-500" />
                        <RenderSeletorVisual tipo="linha" label="Linha Crochê" campoDestino="cor_linha" icon={Palette} colorClass="text-[#06B6D4]" />
                        <RenderSeletorVisual tipo="rolete" label="Roletes" campoDestino="cor_roletes" icon={Layers} colorClass="text-[#06B6D4]" showCopy={true} />
                    </div>

                    <Card className="p-8 rounded-[2.5rem] border-none shadow-sm space-y-6 bg-white">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-4"><Ruler className="h-4 w-4 text-slate-400" /><h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Ficha de Corte</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 p-5 bg-slate-50/50 rounded-3xl">
                                <Label className="text-[9px] font-black text-[#06B6D4] uppercase tracking-widest">Parte Superior</Label>
                                <Select value={formData.modelo_cima} onValueChange={(v) => setFormData({...formData, modelo_cima: v})}>
                                    <SelectTrigger className="h-11 bg-white rounded-xl border-none shadow-sm font-bold"><SelectValue placeholder="Modelo do Top" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Cortininha">Cortininha</SelectItem><SelectItem value="Fixo">Fixo</SelectItem><SelectItem value="Meia Taça">Meia Taça</SelectItem><SelectItem value="Varetinha">Varetinha</SelectItem><SelectItem value="Top Faixa">Top Faixa</SelectItem></SelectContent>
                                </Select>
                                <Select value={formData.tem_bojo} onValueChange={(v) => setFormData({...formData, tem_bojo: v})}>
                                    <SelectTrigger className="h-11 bg-white rounded-xl border-none shadow-sm font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="true">Com Bojo</SelectItem><SelectItem value="false">Sem Bojo</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4 p-5 bg-slate-50/50 rounded-3xl">
                                <Label className="text-[9px] font-black text-[#06B6D4] uppercase tracking-widest">Parte Inferior</Label>
                                <Select value={formData.modelo_baixo} onValueChange={(v) => setFormData({...formData, modelo_baixo: v})}>
                                    <SelectTrigger className="h-11 bg-white rounded-xl border-none shadow-sm font-bold"><SelectValue placeholder="Modelo da Calcinha" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Asa Delta">Asa Delta</SelectItem><SelectItem value="Tradicional">Tradicional</SelectItem><SelectItem value="Fio Dental">Fio Dental</SelectItem><SelectItem value="Meio Fio">Meio Fio</SelectItem><SelectItem value="Larga Confort">Larga Confort</SelectItem></SelectContent>
                                </Select>
                                <Select value={formData.tipo_lateral_baixo} onValueChange={(v) => setFormData({...formData, tipo_lateral_baixo: v})}>
                                    <SelectTrigger className="h-11 bg-white rounded-xl border-none shadow-sm font-bold"><SelectValue placeholder="Tipo da Lateral" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Normal (Inteira)">Normal (Inteira)</SelectItem><SelectItem value="De Amarrar (Lacinho)">De Amarrar (Lacinho)</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-[2.5rem] border-none shadow-sm space-y-6 bg-white">
                        <div onClick={() => inputFileRef.current?.click()} className="h-40 w-full border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                            {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <div className="text-center"><Camera className="h-7 w-7 text-slate-200 mx-auto" /><p className="text-[9px] font-black text-slate-300 uppercase mt-2">Anexar Foto</p></div>}
                            <input type="file" accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFoto} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="font-black text-amber-500 uppercase text-[9px] tracking-widest">Entrega</Label><Input type="date" value={formData.data_entrega} onChange={(e) => setFormData({...formData, data_entrega: e.target.value})} required className="h-14 rounded-2xl bg-amber-50/30 border-none font-black" /></div>
                            <div className="space-y-2"><Label className="font-black text-green-500 uppercase text-[9px] tracking-widest">Valor</Label><Input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} required className="h-14 rounded-2xl bg-green-50/30 border-none font-black text-green-700" /></div>
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-slate-300 uppercase text-[9px] tracking-widest">Observações Importantes</Label>
                            <textarea value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="w-full min-h-[100px] p-4 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 text-sm outline-none resize-none" placeholder="Ex: Detalhes da costura, pingentes..." />
                        </div>
                    </Card>

                    <Button type="submit" disabled={salvando} className="w-full h-20 bg-slate-900 text-white font-black rounded-[2.5rem] text-xl uppercase tracking-widest shadow-xl transition-all active:scale-95">
                        {salvando ? <Loader2 className="animate-spin" /> : "Finalizar Pedido ✨"}
                    </Button>
                </form>
            </main>
        </div>
    );
}