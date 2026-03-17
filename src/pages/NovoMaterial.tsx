import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    ArrowLeft,
    Save,
    Loader2,
    Package,
    Tags,
    Layers,
    AlertCircle,
    ShoppingBag
} from "lucide-react";
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
        toast.success("Material atualizado! ✨");
      } else {
        const { error } = await supabase
          .from("materiais")
          .insert([formData]);
        if (error) throw error;
        toast.success("Material cadastrado no estoque!");
      }
      navigate("/materiais");
    } catch (error) {
      toast.error("Erro ao salvar material");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-widest">
      Consultando prateleiras...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
      </style>

      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logoImg} alt="Fabbis" className="h-10 w-auto rounded-lg" />
          <Button variant="ghost" size="sm" onClick={() => navigate("/materiais")} className="font-bold text-slate-400">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Estoque
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* TÍTULO ESTILIZADO */}
        <div className="text-center mb-10">
          <h1 className="leading-tight flex flex-col items-center">
            <span className="text-7xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>
              {id ? "Editar" : "Novo"}
            </span>
            <span className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em] -mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Material
            </span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-xl shadow-slate-100 space-y-8 bg-white">

            {/* NOME E CATEGORIA */}
            <div className="space-y-6">
                <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                    <Tags className="h-3 w-3 text-cyan-500" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome do Material</label>
                </div>
                <Input
                    required
                    placeholder="Ex: Lycra Shine Ouro, Elástico 10mm..."
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-cyan-500"
                />
                </div>

                <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                    <Layers className="h-3 w-3 text-cyan-500" />
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoria / Tipo</label>
                </div>
                <Input
                    required
                    placeholder="Ex: Tecido, Linha, Aviamento..."
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700"
                />
                </div>
            </div>

            {/* QUANTIDADES */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Quantidade Atual</label>
                <div className="relative">
                    <Input
                        type="number"
                        step="0.01"
                        required
                        value={formData.quantidade}
                        onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})}
                        className="h-14 rounded-2xl bg-slate-50 border-none font-black text-slate-700 text-lg pl-6"
                    />
                    <ShoppingBag className="absolute right-4 top-4 h-5 w-5 text-slate-200" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unidade</label>
                <Input
                  placeholder="Ex: metros, un, rolo"
                  value={formData.unidade_medida}
                  onChange={(e) => setFormData({...formData, unidade_medida: e.target.value})}
                  className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-600"
                />
              </div>
            </div>

            {/* ALERTA DE ESTOQUE */}
            <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Estoque Mínimo</label>
                    <p className="text-[9px] text-amber-600/70 font-bold uppercase">Aviso de reposição</p>
                </div>
              </div>

              <Input
                type="number"
                step="0.1"
                required
                value={formData.estoque_minimo}
                onChange={(e) => setFormData({...formData, estoque_minimo: Number(e.target.value)})}
                className="h-14 rounded-2xl border-none bg-white shadow-inner font-black text-amber-700 text-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-slate-900 hover:bg-black text-white font-black rounded-[2rem] text-lg shadow-xl shadow-slate-100 transition-all uppercase tracking-[0.2em] active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                <div className="flex items-center gap-3">
                   <Save className="h-5 w-5" />
                   <span>{id ? "Atualizar" : "Salvar"} Material</span>
                </div>
              )}
            </Button>
          </Card>
        </form>
      </main>
    </div>
  );
}