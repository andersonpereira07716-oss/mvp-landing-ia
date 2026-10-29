import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, descricao, publico, whatsapp } = req.body;
    const ai = new GoogleGenAI({});

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
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let text = response.text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```/, '').replace(/```$/, '').trim();
    }
    const resultado = JSON.parse(text);

    return res.setHeader('Content-Type', 'text/html; charset=utf-8').status(200).send(`
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
          <div class="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl shadow-xl">
            <h1 class="text-2xl font-bold text-emerald-400 mb-2">✨ Landing Page Criada com Sucesso!</h1>
            <p class="text-sm text-slate-400 mb-4">A página do seu negócio foi gerada pela inteligência artificial.</p>
            <div class="flex gap-4 flex-wrap">
              <button onclick="abrirPagina()" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition cursor-pointer shadow-lg shadow-emerald-500/20">
                🔗 Visualizar Landing Page em Nova Aba
              </button>
              <a href="/" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg text-sm transition">
                Criar Outra
              </a>
            </div>
          </div>
          <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 class="text-lg font-bold text-cyan-400">📦 Kit de Divulgação Automático</h2>
            <div>
              <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1 font-bold">Mensagem para WhatsApp:</h3>
              <div class="bg-slate-950 p-4 rounded-lg text-sm border border-slate-800 whitespace-pre-wrap">${resultado.marketing_kit.whatsapp_pitch}</div>
            </div>
            <div>
              <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1 font-bold">Legenda para Instagram:</h3>
              <div class="bg-slate-950 p-4 rounded-lg text-sm border border-slate-800 whitespace-pre-wrap">${resultado.marketing_kit.instagram_caption}</div>
            </div>
            <div>
              <h3 class="text-xs uppercase tracking-wider text-slate-400 mb-1 font-bold">Script para Reels/TikTok:</h3>
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
    console.error("❌ Erro:", error);
    return res.status(500).send(`
      <div style="background:#09090b;color:#f87171;padding:24px;font-family:sans-serif;height:100vh;box-sizing:border-box;">
        <h2 style="font-size:20px;margin-bottom:8px;">❌ Erro ao processar com IA</h2>
        <p style="color:#94a3b8;font-size:14px;margin-bottom:16px;">Verifique se a chave GEMINI_API_KEY está ativa na Vercel.</p>
        <pre style="background:#18181b;padding:16px;border-radius:8px;overflow-x:auto;font-size:12px;">${error.message}</pre>
        <br><a href="/" style="color:#34d399;text-decoration:none;font-weight:bold;">&larr; Voltar ao início</a>
      </div>
    `);
  }
}
