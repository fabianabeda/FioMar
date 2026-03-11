import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Importação do logo
import logoImg from "@/assets/logo-fabbis.jpeg";

export default function EditarPedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<{ id: string; nome_completo: string }[]>([]);

  const [formData, setFormData] = useState({
    cliente_id: "",
    produto: "Biquíni",
    tamanho: "M",
    cor_frente: "",
    cor_verso: "",
    cor_roletes: "",
    cor_linha: "",
    modelo_cima: "Cortininha",
    bojo: "Não",
    lateral_baixo: "De amarrar",
    modelo_baixo: "Tradicional",
    data_entrega: "",
    valor: "",
    observacoes: "",
    foto_url: "",
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const { data: clientesData } = await supabase.from("clientes").select("id, nome_completo");
      setClientes(clientesData || []);

      const { data: pedido, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (pedido) {
        setFormData({
          cliente_id: pedido.cliente_id || "",
          produto: pedido.produto || "Biquíni",
          tamanho: pedido.tamanho || "M",
          cor_frente: pedido.cor_frente || "",
          cor_verso: pedido.cor_verso || "",
          cor_roletes: pedido.cor_roletes || "",
          cor_linha: pedido.cor_linha || "",
          modelo_cima: pedido.modelo_cima || "Cortininha",
          bojo: pedido.tem_bojo ? "Sim" : "Não",
          lateral_baixo: pedido.tipo_lateral_baixo || "De amarrar",
          modelo_baixo: pedido.modelo_baixo || "Tradicional",
          data_entrega: pedido.data_entrega || "",
          valor: pedido.valor?.toString() || "",
          observacoes: pedido.observacoes || "",
          foto_url: pedido.foto_url || "",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados do pedido");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({
          cliente_id: formData.cliente_id,
          produto: formData.produto,
          tamanho: formData.tamanho,
          cor_frente: formData.cor_frente,
          cor_verso: formData.cor_verso,
          cor_roletes: formData.cor_roletes,
          cor_linha: formData.cor_linha,
          modelo_cima: formData.modelo_cima,
          tem_bojo: formData.bojo === "Sim",
          tipo_lateral_baixo: formData.lateral_baixo,
          modelo_baixo: formData.modelo_baixo,
          data_entrega: formData.data_entrega,
          valor: parseFloat(formData.valor),
          observacoes: formData.observacoes,
          foto_url: formData.foto_url,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Pedido atualizado com sucesso!");
      navigate("/pedidos");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

  return (
    <div className="min-h-screen bg-cyan-50/30 pb-10">
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <img
            src={logoImg}
            alt="Fabbis"
            className="h-20 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <Button variant="ghost" size="sm" className="text-cyan-700 hover:bg-cyan-50" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-3xl font-black text-cyan-900 mb-6">Editar Pedido</h1>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* DADOS INICIAIS */}
          <Card className="rounded-[2rem] overflow-hidden border-none shadow-md">
            <CardHeader className="bg-cyan-500 text-white">
                <CardTitle className="text-lg font-bold">Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6">
              <div className="space-y-2">
                <Label className="text-cyan-900 font-bold">Cliente *</Label>
                <Select value={formData.cliente_id} onValueChange={(v) => setFormData({...formData, cliente_id: v})}>
                  <SelectTrigger className="rounded-xl border-cyan-100 focus:ring-cyan-500"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-cyan-900 font-bold">Produto *</Label>
                  <Select value={formData.produto} onValueChange={(v) => setFormData({...formData, produto: v})}>
                    <SelectTrigger className="rounded-xl border-cyan-100"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Biquíni">Biquíni</SelectItem>
                      <SelectItem value="Maiô">Maiô</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-cyan-900 font-bold">Tamanho *</Label>
                  <Select value={formData.tamanho} onValueChange={(v) => setFormData({...formData, tamanho: v})}>
                    <SelectTrigger className="rounded-xl border-cyan-100"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["PP", "P", "M", "G", "GG"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DESIGN */}
          <Card className="rounded-[2rem] overflow-hidden border-none shadow-md">
            <CardHeader className="bg-cyan-500 text-white"><CardTitle className="text-lg font-bold">Cores e Acabamento</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <div className="space-y-2">
                <Label className="text-cyan-900 font-bold">Cor Principal (Frente) *</Label>
                <Input className="rounded-xl border-cyan-100 focus:border-cyan-500" value={formData.cor_frente} onChange={(e) => setFormData({...formData, cor_frente: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-cyan-900 font-bold">Cor Verso *</Label>
                <Input className="rounded-xl border-cyan-100 focus:border-cyan-500" value={formData.cor_verso} onChange={(e) => setFormData({...formData, cor_verso: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-cyan-900 font-bold">Cor dos Roletes</Label>
                <Input className="rounded-xl border-cyan-100" value={formData.cor_roletes} onChange={(e) => setFormData({...formData, cor_roletes: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-cyan-900 font-bold">Cor da Linha</Label>
                <Input className="rounded-xl border-cyan-100" value={formData.cor_linha} onChange={(e) => setFormData({...formData, cor_linha: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          {/* MODELAGEM */}
          <Card className="rounded-[2rem] overflow-hidden border-none shadow-md">
            <CardHeader className="bg-cyan-500 text-white"><CardTitle className="text-lg font-bold">Modelagem Técnica</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="p-5 bg-cyan-50/50 rounded-2xl border border-cyan-100">
                <h3 className="font-black text-xs uppercase text-cyan-700 tracking-widest mb-4">Parte de Cima</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-cyan-800 text-xs">Modelo</Label>
                    <Select value={formData.modelo_cima} onValueChange={(v) => setFormData({...formData, modelo_cima: v})}>
                      <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cortininha">Cortininha</SelectItem>
                        <SelectItem value="Top Fixo">Top Fixo</SelectItem>
                        <SelectItem value="Tomara que caia">Tomara que caia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-cyan-800 text-xs">Bojo?</Label>
                    <Select value={formData.bojo} onValueChange={(v) => setFormData({...formData, bojo: v})}>
                      <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-cyan-100/30 rounded-2xl border border-cyan-200">
                <h3 className="font-black text-xs uppercase text-cyan-700 tracking-widest mb-4">Parte de Baixo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-cyan-800 text-xs">Lateral</Label>
                    <Select value={formData.lateral_baixo} onValueChange={(v) => setFormData({...formData, lateral_baixo: v})}>
                      <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="De amarrar">De amarrar</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-cyan-800 text-xs">Modelo</Label>
                    <Select value={formData.modelo_baixo} onValueChange={(v) => setFormData({...formData, modelo_baixo: v})}>
                      <SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tradicional">Tradicional</SelectItem>
                        <SelectItem value="Semi-fio">Semi-fio</SelectItem>
                        <SelectItem value="Fio-dental">Fio-dental</SelectItem>
                        <SelectItem value="Largo">Largo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ENTREGA */}
          <Card className="rounded-[2rem] overflow-hidden border-none shadow-md">
            <CardHeader className="bg-cyan-600 text-white"><CardTitle className="text-lg font-bold">Entrega e Valor</CardTitle></CardHeader>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-cyan-900 font-bold">Prazo</Label>
                  <Input className="rounded-xl border-cyan-100" type="date" value={formData.data_entrega} onChange={(e) => setFormData({...formData, data_entrega: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-cyan-900 font-bold">Valor (R$)</Label>
                  <Input className="rounded-xl border-cyan-100 font-bold text-cyan-700" type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-cyan-900 font-bold">Observações Adicionais</Label>
                <Textarea className="rounded-xl border-cyan-100 min-h-[100px]" value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-14 text-lg bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl shadow-lg shadow-cyan-200 transition-all font-black" disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
              SALVAR ALTERAÇÕES
            </Button>
            <Button type="button" variant="outline" className="h-14 px-8 rounded-2xl border-cyan-200 text-cyan-600 hover:bg-cyan-50 font-bold" onClick={() => navigate(-1)}>
              CANCELAR
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}