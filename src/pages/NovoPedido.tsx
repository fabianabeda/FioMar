// pages/NovoPedido.tsx (VERSÃO COM A CORREÇÃO DE user_id)

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

interface Cliente {
    id: string;
    nome_completo: string;
}

export default function NovoPedido() {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        cliente_id: "",
        produto: "biquini",
        modelo_cima: "cortininha",
        modelo_baixo: "tradicional",
        tamanho: "P",
        cor_frente: "",
        cor_verso: "",
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
            const { data, error } = await supabase.from("clientes").select("id, nome_completo").order("nome_completo");
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
            // 1. PEGAMOS O USUÁRIO LOGADO ANTES DE TUDO
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

            // 2. INCLUÍMOS O user.id NOS DADOS A SEREM INSERIDOS
            const { error: insertError } = await supabase.from("pedidos").insert({
                user_id: user.id, // <-- AQUI ESTÁ A CORREÇÃO CRÍTICA
                cliente_id: formData.cliente_id,
                produto: formData.produto,
                modelo_cima: formData.modelo_cima,
                modelo_baixo: formData.modelo_baixo,
                tamanho: formData.tamanho,
                cor_frente: formData.cor_frente,
                cor_verso: formData.cor_verso,
                data_entrega: formData.data_entrega,
                valor: parseFloat(formData.valor),
                observacoes: formData.observacoes || null,
                foto_url: publicUrl,
            });

            if (insertError) throw insertError;

            toast.success("Pedido criado com sucesso!");
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
        // O RESTO DO ARQUIVO (O JSX DO FORMULÁRIO) CONTINUA IGUAL
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/pedidos")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Novo Pedido</h1>
                    <p className="text-muted-foreground">Preencha os dados do novo pedido</p>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <div className="space-y-2">
                            <Label htmlFor="modelo_cima">Modelo Parte de Cima *</Label>
                            <Select value={formData.modelo_cima} onValueChange={(value) => setFormData({ ...formData, modelo_cima: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="cortininha">Cortininha</SelectItem><SelectItem value="top fixo">Top Fixo</SelectItem></SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="modelo_baixo">Modelo Parte de Baixo *</Label>
                            <Select value={formData.modelo_baixo} onValueChange={(value) => setFormData({ ...formData, modelo_baixo: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="tradicional">Tradicional</SelectItem><SelectItem value="meio-fio">Meio-Fio</SelectItem><SelectItem value="fio dental">Fio Dental</SelectItem><SelectItem value="largo">Largo</SelectItem></SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cor_frente">Cor Frente *</Label>
                                <Input id="cor_frente" value={formData.cor_frente} onChange={(e) => setFormData({ ...formData, cor_frente: e.target.value })} placeholder="Ex: Azul turquesa" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cor_verso">Cor Verso *</Label>
                                <Input id="cor_verso" value={formData.cor_verso} onChange={(e) => setFormData({ ...formData, cor_verso: e.target.value })} placeholder="Ex: Coral" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="data_entrega">Data de Entrega *</Label>
                                <Input id="data_entrega" type="date" value={formData.data_entrega} onChange={(e) => setFormData({ ...formData, data_entrega: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="valor">Valor (R$) *</Label>
                                <Input id="valor" type="number" step="0.01" min="0" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })} placeholder="0.00" required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="foto">Foto de Referência (Opcional)</Label>
                            <Input id="foto" type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => { setFotoFile(e.target.files ? e.target.files[0] : null); }} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações adicionais sobre o pedido..." rows={4} />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Criando..." : "Criar Pedido"}</Button>
                            <Button type="button" variant="outline" onClick={() => navigate("/pedidos")}>Cancelar</Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}
