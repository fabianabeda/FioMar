import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

// IMPORTAÇÃO DA LOGOMARCA
import logoImg from "@/assets/logo-fabbis.jpeg";

interface Cliente {
    id: string;
    nome_completo: string;
    telefone: string;
}

export default function NovoPedido() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        cliente_id: "",
        produto: "biquini",
        tamanho: "M",

        // Cores
        cor_frente: "",
        cor_verso: "",
        cor_roletes: "",
        cor_linha: "",

        // Parte de Cima
        modelo_cima: "cortininha",
        tem_bojo: "nao",

        // Parte de Baixo
        tipo_lateral_baixo: "de amarrar",
        modelo_baixo: "tradicional",

        // Dados finais
        data_entrega: "",
        valor: "",
        observacoes: "",
    });

    useEffect(() => {
        checkAuth();
        loadClientes();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate("/auth");
    };

    const loadClientes = async () => {
        try {
            const { data, error } = await supabase
                .from("clientes")
                .select("id, nome_completo, telefone")
                .order("nome_completo");
            if (error) throw error;
            setClientes(data || []);
        } catch (error) {
            const pgError = error as PostgrestError;
            toast.error(pgError.message || "Erro ao carregar clientes");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado. Faça login novamente.");

            let publicUrl: string | null = null;

            if (fotoFile) {
                const fileName = `${Date.now()}_${fotoFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("fotos-pedidos")
                    .upload(fileName, fotoFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("fotos-pedidos")
                    .getPublicUrl(uploadData.path);

                publicUrl = urlData.publicUrl;
            }

            // Inserindo todos os dados novos no banco
            const { error: insertError } = await supabase.from("pedidos").insert({
                user_id: user.id,
                cliente_id: formData.cliente_id,
                produto: formData.produto,
                tamanho: formData.tamanho,

                cor_frente: formData.cor_frente,
                cor_verso: formData.cor_verso,
                cor_roletes: formData.cor_roletes || null,
                cor_linha: formData.cor_linha || null,

                modelo_cima: formData.modelo_cima,
                tem_bojo: formData.tem_bojo === "sim", // Converte 'sim'/'nao' para booleano (true/false)

                tipo_lateral_baixo: formData.tipo_lateral_baixo,
                modelo_baixo: formData.modelo_baixo,

                data_entrega: formData.data_entrega,
                valor: parseFloat(formData.valor),
                observacoes: formData.observacoes || null,
                foto_url: publicUrl,
            });

            if (insertError) throw insertError;

            toast.success("Pedido criado com sucesso!");

            // --- INÍCIO DA INTEGRAÇÃO COM O WHATSAPP ---
            const clienteSelecionado = clientes.find(c => c.id === formData.cliente_id);
            const telefoneCliente = clienteSelecionado?.telefone;

            const mensagem = `Olá, ${clienteSelecionado?.nome_completo}! Seu pedido da *Fabbis* foi registrado com sucesso. 🌊👙\n\n` +
                             `*Resumo do Pedido:*\n` +
                             `- Produto: ${formData.produto} (Tamanho ${formData.tamanho})\n` +
                             `- Parte de Cima: ${formData.modelo_cima} (Bojo: ${formData.tem_bojo === 'sim' ? 'Sim' : 'Não'})\n` +
                             `- Parte de Baixo: Lateral ${formData.tipo_lateral_baixo} / Modelo ${formData.modelo_baixo}\n` +
                             `- Cores Principais: ${formData.cor_frente} e ${formData.cor_verso}\n` +
                             `${formData.cor_roletes ? `- Cor dos Roletes/Acabamento: ${formData.cor_roletes}\n` : ''}` +
                             `${formData.cor_linha ? `- Cor da Linha de Crochê: ${formData.cor_linha}\n` : ''}` +
                             `- Valor: R$ ${formData.valor}\n` +
                             `- Previsão de Entrega: ${formData.data_entrega.split('-').reverse().join('/')}\n\n` +
                             `${formData.observacoes ? `*Observações:* ${formData.observacoes}\n\n` : ''}` +
                             `Qualquer dúvida, é só falar!`;

            if (telefoneCliente) {
                const numeroLimpo = telefoneCliente.replace(/\D/g, '');
                const urlWhatsApp = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`;
                window.open(urlWhatsApp, '_blank');
            } else {
                toast.warning("Aviso: Cliente não possui telefone cadastrado. O WhatsApp não foi aberto.");
            }
            // --- FIM DA INTEGRAÇÃO COM O WHATSAPP ---

            navigate("/pedidos");
        } catch (error) {
            const pgError = error as PostgrestError;
            console.error("Erro no handleSubmit:", pgError);
            toast.error(pgError.message || "Ocorreu um erro ao criar o pedido.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            {/* CABEÇALHO ATUALIZADO */}
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logoImg} alt="Logomarca Fabbis" className="h-32 w-auto object-contain" />
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Novo Pedido</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/pedidos")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Novo Pedido</h1>
                    <p className="text-muted-foreground">Preencha os dados conforme o bloco da Fabbis</p>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. DADOS DA CLIENTE E PRODUTO */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Dados Iniciais</h3>

                            <div className="space-y-2">
                                <Label htmlFor="cliente_id">Cliente *</Label>
                                <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })} required>
                                    <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                                    <SelectContent>{clientes.map((cliente) => (<SelectItem key={cliente.id} value={cliente.id}>{cliente.nome_completo}</SelectItem>))}</SelectContent>
                                </Select>
                                <Button type="button" variant="link" className="p-0 h-auto" onClick={() => navigate("/clientes/novo")}>+ Cadastrar novo cliente</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="produto">Produto *</Label>
                                    <Select value={formData.produto} onValueChange={(value) => setFormData({ ...formData, produto: value })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="biquini">Biquíni</SelectItem><SelectItem value="maiô">Maiô</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tamanho">Tamanho *</Label>
                                    <Select value={formData.tamanho} onValueChange={(value) => setFormData({ ...formData, tamanho: value })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="PP">PP</SelectItem><SelectItem value="P">P</SelectItem><SelectItem value="M">M</SelectItem><SelectItem value="G">G</SelectItem><SelectItem value="GG">GG</SelectItem></SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* 2. CORES */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Cores</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cor_frente">Cor 1 (Principal/Frente) *</Label>
                                    <Input id="cor_frente" value={formData.cor_frente} onChange={(e) => setFormData({ ...formData, cor_frente: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cor_verso">Cor 2 (Verso) *</Label>
                                    <Input id="cor_verso" value={formData.cor_verso} onChange={(e) => setFormData({ ...formData, cor_verso: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cor_roletes">Cor dos Roletes/Acabamento</Label>
                                    <Input id="cor_roletes" value={formData.cor_roletes} onChange={(e) => setFormData({ ...formData, cor_roletes: e.target.value })} placeholder="Opcional" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cor_linha">Cor da Linha de Crochê</Label>
                                    <Input id="cor_linha" value={formData.cor_linha} onChange={(e) => setFormData({ ...formData, cor_linha: e.target.value })} placeholder="Opcional" />
                                </div>
                            </div>
                        </div>

                        {/* 3. PARTE DE CIMA */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Parte de Cima</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="modelo_cima">Modelo *</Label>
                                    <Select value={formData.modelo_cima} onValueChange={(value) => setFormData({ ...formData, modelo_cima: value })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cortininha">Cortininha</SelectItem>
                                            <SelectItem value="top fixo">Top Fixo</SelectItem>
                                            <SelectItem value="tomara que caia">Tomara que caia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tem_bojo">Bojo? *</Label>
                                    <Select value={formData.tem_bojo} onValueChange={(value) => setFormData({ ...formData, tem_bojo: value })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sim">Sim</SelectItem>
                                            <SelectItem value="nao">Não</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* 4. PARTE DE BAIXO */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Parte de Baixo (Calcinha)</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tipo_lateral_baixo">Lateral *</Label>
                                    <Select value={formData.tipo_lateral_baixo} onValueChange={(value) => setFormData({ ...formData, tipo_lateral_baixo: value })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="de amarrar">De amarrar</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="modelo_baixo">Modelo *</Label>
                                    <Select value={formData.modelo_baixo} onValueChange={(value) => setFormData({ ...formData, modelo_baixo: value })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tradicional">Tradicional</SelectItem>
                                            <SelectItem value="semi-fio">Semi-fio</SelectItem>
                                            <SelectItem value="fio-dental">Fio-dental</SelectItem>
                                            <SelectItem value="largo">Largo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* 5. DADOS FINAIS */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Entrega e Valores</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="data_entrega">Data de Entrega *</Label>
                                    <Input id="data_entrega" type="date" value={formData.data_entrega} onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="valor">Valor Total (R$) *</Label>
                                    <Input id="valor" type="number" step="0.01" min="0" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0.00" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="foto">Foto de Referência (Opcional)</Label>
                                <Input id="foto" type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => { setFotoFile(e.target.files ? e.target.files[0] : null); }} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="observacoes">Observações</Label>
                                <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Detalhes extras, ajustes de medida..." rows={3} />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 mt-6 border-t">
                            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Salvando..." : "Salvar Pedido"}</Button>
                            <Button type="button" variant="outline" onClick={() => navigate("/pedidos")}>Cancelar</Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}