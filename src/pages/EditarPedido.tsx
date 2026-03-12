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
import { ArrowLeft, Save, Loader2, Camera, Scissors, Palette, Image as ImageIcon, Info } from "lucide-react";
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

            if (clientesRes.error) throw clientesRes.error;
            if (materiaisRes.error) throw materiaisRes.error;
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

        } catch (error) { toast.error("Erro ao carregar dados do pedido."); } finally { setLoading(false); }
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

        setSaving(true);
        let urlDaFotoSalva = fotoOriginal; // Mantém a antiga se não mudar

        try {
            if (arquivoFoto) {
                toast.info("A atualizar a foto...", { duration: 3000 });
                let fotoParaEnviar = arquivoFoto;
                try { fotoParaEnviar = await comprimirImagem(arquivoFoto); } catch (e) {}

                const nomeArquivo = `${Math.random().toString(36).substring(2)}.jpg`;
                const { error: uploadError } = await supabase.storage.from("pedidos").upload(nomeArquivo, fotoParaEnviar);
                if (!uploadError) {
                    const { data } = supabase.storage.from("pedidos").getPublicUrl(nomeArquivo);
                    urlDaFotoSalva = data.publicUrl;

                    // Apaga a foto antiga do servidor para não ocupar espaço
                    if (fotoOriginal) {
                        const nomeAntigo = fotoOriginal.split('/').pop();
                        if (nomeAntigo) await supabase.storage.from("pedidos").remove([nomeAntigo]);
                    }
                }
            }

            const { error } = await supabase.from("pedidos").update({
                cliente_id: formData.cliente_id,
                produto: formData.produto,
                tamanho: formData.tamanho,
                cor_frente: formData.cor_frente,
                cor_verso: formData.cor_verso,
                cor_roletes: formData.cor_roletes,
                cor_linha: formData.cor_linha,
                modelo_cima: formData.modelo_cima,
                tem_bojo: formData.tem_bojo === "true",
                modelo_baixo: formData.modelo_baixo,
                tipo_lateral_baixo: formData.tipo_lateral_baixo,
                data_entrega: formData.data_entrega,
                valor: parseFloat(formData.valor || "0"),
                observacoes: formData.observacoes,
                foto_url: urlDaFotoSalva
            }).eq("id", id);

            if (error) throw error;
            toast.success("Pedido atualizado com sucesso!");
            navigate(-1);
        } catch (error) { toast.error("Erro ao guardar as alterações."); } finally { setSaving(false); }
    };

    const RenderSeletorVisual = ({ tipo, label, campoDestino, icon: Icon, colorClass }: any) => {
        const opcoes = materiais.filter(m => m.tipo === tipo);
        const valorAtual = formData[campoDestino as keyof typeof formData] as string;

        return (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${colorClass}`} /><Label className="font-bold text-slate-700 uppercase text-[10px]">{label}</Label></div>
                {opcoes.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {opcoes.map(m => (
                            <div key={m.id} onClick={() => setFormData({...formData, [campoDestino]: m.nome})} className={`flex flex-col items-center gap-1 cursor-pointer min-w-[70px] transition-all ${valorAtual === m.nome ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'}`}>
                                <div className={`w-14 h-14 rounded-full overflow-hidden border-4 ${valorAtual === m.nome ? 'border-blue-500 shadow-md' : 'border-transparent'}`}>
                                    {m.foto_url ? <img src={m.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center"><ImageIcon className="h-4 w-4" /></div>}
                                </div>
                                <span className="text-[10px] font-bold text-center w-full truncate text-slate-700">{m.nome}</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-xs text-slate-400 italic">Nenhum material cadastrado.</p>}
                <Input placeholder={`Ou digite a cor...`} value={valorAtual} onChange={(e) => setFormData({...formData, [campoDestino]: e.target.value})} className="h-10 text-sm bg-slate-50 border-slate-200" />
            </div>
        );
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600"><Loader2 className="animate-spin mr-2" /> A carregar pedido...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-500 rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
                    <h1 className="text-lg font-black text-slate-900 uppercase">Editar Pedido</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6 rounded-2xl border-none shadow-sm space-y-5">
                        <div className="space-y-2">
                            <Label className="font-bold text-[10px] uppercase">Cliente *</Label>
                            {clientes.length > 0 ? (
                                <Select value={formData.cliente_id} onValueChange={(v) => setFormData({...formData, cliente_id: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 font-bold"><SelectValue placeholder="Selecione a cliente..." /></SelectTrigger>
                                    <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : <div className="p-4 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold flex items-center gap-2"><Info className="h-5 w-5" /> Cadastre uma cliente primeiro.</div>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold text-[10px] uppercase">Produto</Label>
                                <Select value={formData.produto} onValueChange={(v) => setFormData({...formData, produto: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Biquíni">Biquíni</SelectItem><SelectItem value="Maiô">Maiô</SelectItem><SelectItem value="Saída de Praia">Saída de Praia</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold text-[10px] uppercase">Tamanho</Label>
                                <Select value={formData.tamanho} onValueChange={(v) => setFormData({...formData, tamanho: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="PP">PP</SelectItem><SelectItem value="P">P</SelectItem><SelectItem value="M">M</SelectItem><SelectItem value="G">G</SelectItem><SelectItem value="GG">GG</SelectItem></SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-black text-slate-800 text-sm uppercase pl-2">Escolha os Materiais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RenderSeletorVisual tipo="tecido" label="Frente (Tecido)" campoDestino="cor_frente" icon={Scissors} colorClass="text-pink-500" />
                            <RenderSeletorVisual tipo="tecido" label="Verso (Tecido)" campoDestino="cor_verso" icon={Scissors} colorClass="text-pink-500" />
                            <RenderSeletorVisual tipo="linha" label="Linha Crochê" campoDestino="cor_linha" icon={Palette} colorClass="text-cyan-500" />
                            <RenderSeletorVisual tipo="rolete" label="Roletes" campoDestino="cor_roletes" icon={ImageIcon} colorClass="text-purple-500" />
                        </div>
                    </div>

                    <Card className="p-6 rounded-2xl border-none shadow-sm space-y-5">
                        <h3 className="font-black text-slate-800 text-sm uppercase">Modelagem da Peça</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="space-y-2"><Label className="font-bold text-blue-700 text-[10px] uppercase">Modelo Top</Label><Input value={formData.modelo_cima} onChange={(e) => setFormData({...formData, modelo_cima: e.target.value})} className="h-11 bg-white" /></div>
                            <div className="space-y-2"><Label className="font-bold text-blue-700 text-[10px] uppercase">Tem Bojo?</Label><Select value={formData.tem_bojo} onValueChange={(v) => setFormData({...formData, tem_bojo: v})}><SelectTrigger className="h-11 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                            <div className="space-y-2"><Label className="font-bold text-purple-700 text-[10px] uppercase">Modelo Calcinha</Label><Input value={formData.modelo_baixo} onChange={(e) => setFormData({...formData, modelo_baixo: e.target.value})} className="h-11 bg-white" /></div>
                            <div className="space-y-2"><Label className="font-bold text-purple-700 text-[10px] uppercase">Lateral</Label><Input value={formData.tipo_lateral_baixo} onChange={(e) => setFormData({...formData, tipo_lateral_baixo: e.target.value})} className="h-11 bg-white" /></div>
                        </div>
                    </Card>

                    <Card className="p-6 rounded-2xl border-none shadow-sm space-y-5">
                        <div className="space-y-2">
                            <Label className="font-bold text-[10px] uppercase flex justify-between">
                                Foto de Referência <span className="text-slate-400">Opcional</span>
                            </Label>
                            <div onClick={() => inputFileRef.current?.click()} className="h-40 w-full border-2 border-dashed bg-slate-50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden relative">
                                {previewUrl ? <><img src={previewUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><p className="text-white font-bold text-xs"><Camera className="inline h-4 w-4 mr-1" /> Trocar Foto</p></div></> : <div className="text-center"><Camera className="h-8 w-8 text-slate-300 mx-auto" /><p className="font-bold text-slate-500 text-xs mt-2">Anexar nova foto</p></div>}
                                <input type="file" accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFoto} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="font-bold text-orange-600 text-[10px] uppercase">Prazo *</Label><Input type="date" value={formData.data_entrega} onChange={(e) => setFormData({...formData, data_entrega: e.target.value})} required className="h-12 border-orange-200 bg-orange-50 font-bold" /></div>
                            <div className="space-y-2"><Label className="font-bold text-green-600 text-[10px] uppercase">Valor *</Label><Input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} required className="h-12 border-green-200 bg-green-50 font-black text-green-700" /></div>
                        </div>
                        <div className="space-y-2"><Label className="font-bold text-yellow-600 text-[10px] uppercase">Observações</Label><Input value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} className="h-12 bg-yellow-50/50 border-yellow-200" /></div>
                    </Card>

                    <div className="flex gap-4">
                        <Button type="submit" className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-lg uppercase shadow-lg shadow-blue-200" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            SALVAR ALTERAÇÕES
                        </Button>
                        <Button type="button" variant="outline" className="h-16 px-6 font-bold text-slate-500 rounded-2xl border-slate-200" onClick={() => navigate(-1)} disabled={saving}>
                            CANCELAR
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    );
}