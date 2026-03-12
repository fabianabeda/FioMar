import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

export default function NovoMaterial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    quantidade: 0,
    unidade_medida: "metros",
    estoque_minimo: 1,
  });

  useEffect(() => {
    if (id) loadMaterial();
  }, [id]);

  const loadMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from("materiais")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) setFormData(data);
    } catch (error) {
      toast.error("Erro ao carregar material");
      navigate("/materiais");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        const { error } = await supabase
          .from("materiais")
          .update(formData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Material atualizado!");
      } else {
        const { error } = await supabase
          .from("materiais")
          .insert([formData]);
        if (error) throw error;
        toast.success("Material cadastrado!");
      }
      navigate("/materiais");
    } catch (error) {
      toast.error("Erro ao salvar material");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center p-20 font-bold text-slate-400">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b p-2 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <img src={logoImg} alt="Fabbis" className="h-12 w-auto" />
          <Button variant="ghost" onClick={() => navigate("/materiais")} className="text-slate-500">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">{id ? "Editar Material" : "Novo Material"}</h1>
          <p className="text-slate-500">Mantenha seu estoque sempre em dia</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 rounded-[2rem] border-none shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Nome do Material</label>
              <Input
                required
                placeholder="Ex: Lycra Preta, Linha de Crochê Rosa..."
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="h-12 rounded-xl border-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 ml-1">Categoria</label>
              <Input
                required
                placeholder="Ex: Tecido, Linha, Elástico, Bojo..."
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="h-12 rounded-xl border-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Qtd. Atual</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantidade}
                  onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})}
                  className="h-12 rounded-xl border-slate-100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Unidade</label>
                <Input
                  placeholder="Ex: metros, un, rolo"
                  value={formData.unidade_medida}
                  onChange={(e) => setFormData({...formData, unidade_medida: e.target.value})}
                  className="h-12 rounded-xl border-slate-100"
                />
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-amber-600" />
                <label className="text-xs font-black uppercase text-amber-700">Estoque Mínimo (Alerta)</label>
              </div>
              <Input
                type="number"
                step="0.1"
                required
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({...formData, estoque_minimo: Number(e.target.value)})}
                className="h-12 rounded-xl border-amber-200 bg-white"
              />
              <p className="text-[10px] text-amber-600 mt-2 font-medium">O sistema te avisará quando a quantidade for igual ou menor que este valor.</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-lg shadow-lg shadow-slate-200 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> SALVAR MATERIAL</>}
            </Button>
          </Card>
        </form>
      </main>
    </div>
  );
}