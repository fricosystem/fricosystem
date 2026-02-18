import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Camera, Upload, ScanSearch, Link as LinkIcon, KeyRound } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Fonte = { label?: string; url?: string };

type ResultadoIA = {
  nome?: string;
  marca?: string;
  modelo?: string;
  peso?: string;
  valor?: number;
  fornecedor?: string;
  ean?: string;
  descricao?: string;
  fontes?: Fonte[];
};

const IdentificacaoProdutos = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoIA | null>(null);
  const [provider, setProvider] = useState<"openai" | "anthropic" | "deepseek">("openai");
  const [apiKey, setApiKey] = useState<string>("");

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch {
      toast.error("Não foi possível acessar a câmera. Use o upload de imagem.");
    }
  };

  const pararCamera = () => {
    const video = videoRef.current;
    const stream = video && (video.srcObject as MediaStream | null);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    if (video) {
      video.srcObject = null;
    }
    setStreaming(false);
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(b => {
      if (!b) return;
      setImageBlob(b);
      setResultado(null);
      const url = URL.createObjectURL(b);
      setImagePreview(url);
      toast.success("Foto capturada");
    }, "image/jpeg", 0.95);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageBlob(file);
    setResultado(null);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    toast.success("Imagem carregada");
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve(res.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const identificarProduto = async () => {
    if (!imageBlob) {
      toast.error("Capture ou carregue uma imagem do produto");
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const base64 = await blobToBase64(imageBlob);
      if (!apiKey) {
        toast.error("Informe a API Key para o provedor selecionado");
        setLoading(false);
        return;
      }
      
      const prompt = `
        Você é um assistente de identificação de produtos. Analise apenas a imagem enviada e retorne um JSON com:
        {
          "nome": string,
          "marca": string,
          "modelo": string,
          "peso": string, 
          "valor": number | null,
          "fornecedor": string,
          "ean": string,
          "descricao": string,
          "fontes": [{"label": string, "url": string}]
        }
        Regras:
        - Use somente informações visíveis na embalagem/etiquetas/códigos da imagem.
        - Se não houver dados suficientes na imagem para "valor" (preço) e "fornecedor", deixe "valor" como null e "fornecedor" vazio.
        - Se houver código de barras/GTIN/EAN visível, extraia-o e retorne em "ean".
        - Não invente links nem marcas; não faça suposições. Se não tiver certeza, deixe o campo vazio.
        - Retorne apenas JSON válido, sem comentários e sem texto adicional.
      `.trim();

      let data: ResultadoIA | null = null;
      if (provider === "openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "Responda somente com JSON válido conforme solicitado." },
              { 
                role: "user", 
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                ]
              }
            ]
          })
        });
        if (!resp.ok) throw new Error("Falha na chamada OpenAI");
        const json = await resp.json();
        const text = json?.choices?.[0]?.message?.content || "{}";
        data = JSON.parse(text);
      } else if (provider === "anthropic") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-opus-20240229",
            max_tokens: 1024,
            temperature: 0,
            system: "Responda somente com JSON válido conforme solicitado.",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } }
                ]
              }
            ]
          })
        });
        if (!resp.ok) throw new Error("Falha na chamada Anthropic (Claude)");
        const json = await resp.json();
        const textItem = Array.isArray(json?.content) ? json.content.find((c: any) => c.type === "text") : null;
        const text = textItem?.text || "{}";
        data = JSON.parse(text);
      } else if (provider === "deepseek") {
        const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-vl",
            temperature: 0,
            messages: [
              { role: "system", content: "Responda somente com JSON válido conforme solicitado." },
              { 
                role: "user", 
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
                ]
              }
            ]
          })
        });
        if (!resp.ok) throw new Error("Falha na chamada DeepSeek");
        const json = await resp.json();
        const text = json?.choices?.[0]?.message?.content || "{}";
        data = JSON.parse(text);
      }

      if (!data) {
        throw new Error("Resposta vazia da IA");
      }
      setResultado(data);
      if (!data || (!data.nome && !data.marca)) {
        toast.info("IA não conseguiu identificar com confiança. Tente outra foto.");
      } else {
        toast.success("Produto identificado");
      }
    } catch (err) {
      toast.error("Erro ao identificar o produto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      pararCamera();
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5" />
            Identificação de Produtos por Imagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Provedor de IA</Label>
                  <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                      <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
                      <SelectItem value="deepseek">DeepSeek (VL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>API Key</Label>
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="Cole sua API Key (não é armazenada)" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {!streaming ? (
                  <Button onClick={iniciarCamera} variant="default" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Usar Câmera
                  </Button>
                ) : (
                  <Button onClick={pararCamera} variant="secondary" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Parar Câmera
                  </Button>
                )}
                <Label htmlFor="upload" className="sr-only">Upload</Label>
                <Input id="upload" type="file" accept="image/*" capture="environment" onChange={handleUpload} />
              </div>
              <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[260px]">
                {streaming ? (
                  <video ref={videoRef} className="w-full h-full object-contain" playsInline />
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Pré-visualização" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <Upload className="h-8 w-8 mb-2" />
                    Selecione uma imagem ou use a câmera
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button onClick={capturarFoto} disabled={!streaming} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Capturar Foto
                </Button>
                <Button onClick={identificarProduto} disabled={!imageBlob || loading} className="gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                  Identificar
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={resultado?.nome || ""} readOnly placeholder="Resposta da IA" />
                </div>
                <div>
                  <Label>Marca</Label>
                  <Input value={resultado?.marca || ""} readOnly placeholder="Resposta da IA" />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <Input value={resultado?.modelo || ""} readOnly placeholder="Resposta da IA" />
                </div>
                <div>
                  <Label>Peso</Label>
                  <Input value={resultado?.peso || ""} readOnly placeholder="Resposta da IA" />
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input value={resultado?.valor ? `R$ ${resultado.valor.toFixed(2)}` : ""} readOnly placeholder="Busca de melhor preço" />
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Input value={resultado?.fornecedor || ""} readOnly placeholder="Fornecedor do melhor preço" />
                </div>
                <div className="md:col-span-2">
                  <Label>GNIT/EAN</Label>
                  <Input value={resultado?.ean || ""} readOnly placeholder="Busca de código na web" />
                </div>
                <div className="md:col-span-2">
                  <Label>Detalhes do Produto</Label>
                  <Textarea value={resultado?.descricao || ""} readOnly placeholder="Descrição e características reais" />
                </div>
              </div>
              {resultado?.fontes && resultado.fontes.length > 0 && (
                <div className="space-y-2">
                  <Label>Fontes</Label>
                  <div className="space-y-1">
                    {resultado.fontes.map((f, idx) => (
                      <a key={`${f.url}-${idx}`} href={f.url} target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1">
                        <LinkIcon className="h-3.5 w-3.5" />
                        {f.label || f.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdentificacaoProdutos;
