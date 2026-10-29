import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ai = new GoogleGenAI({});

async function gerarLandingEKit({ nome, descricao, publico, whatsapp }) {
  const prompt = `Crie uma landing page em HTML moderno utilizando Tailwind CSS e um kit de marketing para a marca: ${nome}.
  Descrição: ${descricao}
  Público-alvo: ${publico}
  WhatsApp: ${whatsapp}
  
  Retorne estritamente um JSON válido (sem blocos de markdown em volta, apenas o JSON puro) com a seguinte estrutura exata:
  {
    "landing_page_html": "<!DOCTYPE html>...",
    "marketing_kit": {
      "whatsapp_pitch": "...",
      "instagram_caption": "...",
      "reels_script": "..."
    }
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  let text = response.text.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (text.startsWith('```')) {
    text = text.replace(/^```/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(text);
}

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

app.post('/gerar', async (req, res) => {
  try {
    const { nome, descricao, publico, whatsapp } = req.body;
    const resultado = await gerarLandingEKit({ nome, descricao, publico, whatsapp });

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR" class="dark">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sucesso - ${nome}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen p-6">
        <div class="max-w-3xl mx-auto space-y-6">
          <div class="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl">
            <h1 class="text-2xl font-bold text-emerald-400 mb-2">✨ Landing Page Criada com Sucesso!</h1>
            <p class="text-sm text-slate-400 mb-4">A página do seu negócio foi gerada pela IA.</p>
            <div class="flex gap-4">
              <button onclick="abrirPagina()" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition cursor-pointer">
                🔗 Visualizar Landing Page em Nova Aba
              </button>
              <a href="/" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg text-sm transition">
                Criar Outra
              </a>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 class="text-lg font-bold text-cyan-400">📦 Kit de Divulgação Automático</h2>
            <div>
              <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1">Mensagem para WhatsApp:</h3>
              <div class="bg-slate-950 p-4 rounded-lg text-sm border border-slate-800 whitespace-pre-wrap">${resultado.marketing_kit.whatsapp_pitch}</div>
            </div>
            <div>
              <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1">Legenda para Instagram:</h3>
              <div class="bg-slate-950 p-4 rounded-lg text-sm border border-slate-800 whitespace-pre-wrap">${resultado.marketing_kit.instagram_caption}</div>
            </div>
            <div>
              <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1">Script para Reels/TikTok:</h3>
              <div class="bg-slate-950 p-4 rounded-lg text-sm border border-slate-800 whitespace-pre-wrap">${resultado.marketing_kit.reels_script}</div>
            </div>
          </div>
        </div>
        <script>
          function abrirPagina() {
            const htmlConteudo = ${JSON.stringify(resultado.landing_page_html)};
            const blob = new Blob([htmlConteudo], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Erro detalhado:", error);
    res.status(500).send(`Erro detalhado ao processar com IA: <pre style="color: #ff6b6b; margin-top: 10px;">${error.stack || error.message}</pre>`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

export default app;
