// pages/EditarPedido.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

interface Cliente {
    id: string;
    nome_completo: string;
}

export default function EditarPedido() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        cliente_id: "",
        produto: "biquini",
        modelo_cima: "cortininha",
        modelo_baixo: "tradicional",
        cor_frente: "",
        cor_verso: "",
        data_entrega: "",
        valor: "",
        observacoes: "",
        status: "pendente", // Adicionamos o status ao formulário
    });

    useEffect(() => {
        checkAuth();
        loadClientes();
        loadPedidoData();
    }, [id]);

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
            toast.error("Erro ao carregar clientes");
        }
    };

    const loadPedidoData = async () => {
        if (!id) {
            toast.error("ID do pedido não encontrado.");
            navigate("/pedidos");
            return;
        }
        try {
            const { data, error } = await supabase.from("pedidos").select("*").eq("id", id).single();
            if (error) throw error;
            if (data) {
                setFormData({
                    cliente_id: data.cliente_id,
                    produto: data.produto,
                    modelo_cima: data.modelo_cima,
                    modelo_baixo: data.modelo_baixo,
                    cor_frente: data.cor_frente,
                    cor_verso: data.cor_verso,
                    data_entrega: data.data_entrega,
                    valor: String(data.valor),
                    observacoes: data.observacoes || "",
                    status: data.status || "pendente",
                });
            }
        } catch (error) {
            toast.error("Erro ao carregar dados do pedido.");
            navigate("/pedidos");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from("pedidos").update({
                cliente_id: formData.cliente_id,
                produto: formData.produto,
                modelo_cima: formData.modelo_cima,
                modelo_baixo: formData.modelo_baixo,
                cor_frente: formData.cor_frente,
                cor_verso: formData.cor_verso,
                data_entrega: formData.data_entrega,
                valor: parseFloat(formData.valor),
                observacoes: formData.observacoes || null,
                status: formData.status,
            }).eq("id", id);

            if (error) throw error;
            toast.success("Pedido atualizado com sucesso!");
            navigate("/pedidos");
        } catch (error: any) {
            toast.error(error.message || "Erro ao atualizar pedido");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            <header className="border-b bg-card/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/pedidos")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Editar Pedido</h1>
                    <p className="text-muted-foreground">Atualize os dados do pedido</p>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo de Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status do Pedido *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="em_producao">Em Produção</SelectItem>
                                    <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                                    <SelectItem value="concluido">Concluído</SelectItem>
                                    <SelectItem value="entregue">Entregue</SelectItem>
                                    <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Restante do formulário... */}
                        <div className="space-y-2">
                            <Label htmlFor="cliente_id">Cliente *</Label>
                            <Select
                                value={formData.cliente_id}
                                onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clientes.map((cliente) => (
                                        <SelectItem key={cliente.id} value={cliente.id}>
                                            {cliente.nome_completo}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ... (copie e cole o resto dos campos do seu formulário de NovoPedido aqui) ... */}
                        {/* Exemplo: */}
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
                            <Label htmlFor="observacoes">Observações</Label>
                            <Textarea id="observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações adicionais..." rows={4} />
                        </div>


                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => navigate("/pedidos")}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}
