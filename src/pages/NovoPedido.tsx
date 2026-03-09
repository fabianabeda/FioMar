import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";

export default function NovoPedido() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [foto, setFoto] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    cliente_id: "",
    produto: "",
    tamanho: "",
    detalhes_cima: "",
    detalhes_baixo: "",
    cores: "",
    valor: "",
    data_entrega: "",
    observacoes: "",
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    const { data } = await supabase.from("clientes").select("*").order("nome_completo");
    if (data) setClientes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      let fotoUrl = "";
      if (foto) {
        const fileExt = foto.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('fotos-pedidos')
          .upload(fileName, foto);

        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('fotos-pedidos').getPublicUrl(fileName);
        fotoUrl = publicUrl;
      }

      const { data: pedidoCriado, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          user_id: user.id,
          cliente_id: formData.cliente_id,
          produto: formData.produto,
          tamanho: formData.tamanho,
          detalhes_cima: formData.detalhes_cima,
          detalhes_baixo: formData.detalhes_baixo,
          cores: formData.cores,
          valor: parseFloat(formData.valor),
          data_entrega: formData.data_entrega,
          observacoes: formData.observacoes,
          foto_referencia: fotoUrl,
          status: "pendente"
        })
        .select('*, clientes(nome_completo, telefone)')
        .single();

      if (pedidoError) throw pedidoError;

      toast.success("Pedido salvo com sucesso!");

      // --- LÓGICA DO WHATSAPP ---
      const cliente = pedidoCriado.clientes;
      if (cliente && cliente.telefone) {
        const numeroLimpo = cliente.telefone.replace(/\D/g, "");
        const mensagem = encodeURIComponent(
          `Olá, ${cliente.nome_completo}! Seu pedido da *Fabbis* foi registrado com sucesso. 🌊👙\n\n` +
          `*Resumo do Pedido:*\n` +
          `- Produto: ${formData.produto} (Tam: ${formData.tamanho})\n` +
          `- Detalhes: ${formData.detalhes_cima} / ${formData.detalhes_baixo}\n` +
          `- Cores: ${formData.cores}\n` +
          `- Valor: R$ ${formData.valor}\n` +
          `- Previsão de Entrega: ${new Date(formData.data_entrega).toLocaleDateString('pt-BR')}\n\n` +
          `Qualquer dúvida, é só falar!`
        );

        // Abre o WhatsApp em uma nova aba
        window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, "_blank");
      }

      navigate("/pedidos");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/")}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Novo Pedido</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select onValueChange={(v) => setFormData({...formData, cliente_id: v})} required>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Produto</Label><Input placeholder="Ex: Biquíni" onChange={e => setFormData({...formData, produto: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Tamanho</Label><Input placeholder="Ex: M" onChange={e => setFormData({...formData, tamanho: e.target.value})} required /></div>
            </div>

            <div className="space-y-2"><Label>Parte de Cima</Label><Input placeholder="Detalhes (bojo, alça...)" onChange={e => setFormData({...formData, detalhes_cima: e.target.value})} /></div>
            <div className="space-y-2"><Label>Parte de Baixo</Label><Input placeholder="Detalhes (modelo, lateral...)" onChange={e => setFormData({...formData, detalhes_baixo: e.target.value})} /></div>
            <div className="space-y-2"><Label>Cores</Label><Input placeholder="Cores principais" onChange={e => setFormData({...formData, cores: e.target.value})} /></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" onChange={e => setFormData({...formData, valor: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Data de Entrega</Label><Input type="date" onChange={e => setFormData({...formData, data_entrega: e.target.value})} required /></div>
            </div>

            <div className="space-y-2">
              <Label>Foto de Referência</Label>
              <Input type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] || null)} className="cursor-pointer" />
            </div>

            <div className="space-y-2"><Label>Observações</Label><Textarea rows={3} onChange={e => setFormData({...formData, observacoes: e.target.value})} /></div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Pedido e Enviar WhatsApp"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}