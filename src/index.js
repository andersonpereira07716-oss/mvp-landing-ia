import { GoogleGenAI, Type } from '@google/genai';
import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para ler JSON e dados de formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ai = new GoogleGenAI({});

// Função que chama o Agente do Gemini
async function gerarLandingEKit(dadosBriefing) {
  const prompt = `
  Você é um agente especialista em Copywriting, UI/UX e Marketing Digital.
  
  Gere uma Landing Page completa em HTML5 usando Tailwind CSS (via CDN) com estilo dark mode moderno, cores vibrantes (neon/emerald) e foco total em conversão no WhatsApp.
  
  Dados do Produto/Serviço:
  - Nome/Marca: ${dadosBriefing.nome}
  - Descrição: ${dadosBriefing.descricao}
  - Público-Alvo: ${dadosBriefing.publico}
  - WhatsApp de Contato: ${dadosBriefing.whatsapp}

  Além do código da página, crie um Kit de Divulgação completo para o cliente promover este produto.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          landing_page_html: {
            type: Type.STRING,
            description: 'Código HTML completo e funcional com Tailwind CSS CDN, responsivo e pronto para publicar.'
          },
          marketing_kit: {
            type: Type.OBJECT,
            properties: {
              whatsapp_pitch: {
                type: Type.STRING,
                description: 'Mensagem pronta para prospecção direta ou resposta no WhatsApp.'
              },
              instagram_caption: {
                type: Type.STRING,
                description: 'Legenda atrativa para post do Instagram/Facebook com hashtags.'
              },
              reels_script: {
                type: Type.STRING,
                description: 'Script curto de 15 a 30 segundos para gravar um Reels/TikTok.'
              },
              estrategia_divulgacao: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de 3 ações práticas de divulgação orgânica.'
              }
            },
            required: ['whatsapp_pitch', 'instagram_caption', 'reels_script', 'estrategia_divulgacao']
          }
        },
        required: ['landing_page_html', 'marketing_kit']
      }
    }
  });

  return JSON.parse(response.text);
}

// 🌐 Rota principal: Formulário simples para testar o MVP
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR" class="dark">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MVP - Gerador de Landing Pages por IA</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl shadow-xl shadow-emerald-500/5">
        <h1 class="text-2xl font-bold mb-2 text-emerald-400">⚡ Gerador de Landing IA</h1>
        <p class="text-sm text-slate-400 mb-6">Preencha os dados do negócio para gerar a página e o kit de marketing.</p>
        
        <form action="/gerar" method="POST" class="space-y-4" onsubmit="this.querySelector('button').innerText='Gerando com IA...';">
          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-400 mb-1">Nome da Marca / Produto</label>
            <input type="text" name="nome" required class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Ex: BarberStyle">
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-400 mb-1">Descrição do Serviço</label>
            <textarea name="descricao" required rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Ex: Corte de cabelo masculino com cerveja gelada inclusa."></textarea>
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-400 mb-1">Público-Alvo</label>
            <input type="text" name="publico" required class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Ex: Homens modernos de 20 a 40 anos">
          </div>
          <div>
            <label class="block text-xs uppercase tracking-wider text-slate-400 mb-1">WhatsApp de Contato</label>
            <input type="text" name="whatsapp" required class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-emerald-500 focus:outline-none" placeholder="Ex: 5583999999999">
          </div>
          <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-500/20">
            Gerar Landing Page e Kit 🚀
          </button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 🚀 Endpoint POST que processa a IA e salva o arquivo HTML gerado
app.post('/gerar', async (req, res) => {
  try {
    const { nome, descricao, publico, whatsapp } = req.body;
    
    console.log(`\n📥 Recebido pedido para: ${nome}`);
    const resultado = await gerarLandingEKit({ nome, descricao, publico, whatsapp });

    // Salva o HTML gerado em uma pasta 'public' para o cliente acessar
    if (!fs.existsSync('public')) {
      fs.mkdirSync('public');
    }
    
    const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const caminhoArquivo = path.join('public', `${slug}.html`);
    fs.writeFileSync(caminhoArquivo, resultado.landing_page_html);

    // Retorna uma página de sucesso bonita com o preview e o kit
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
            <p class="text-sm text-slate-400 mb-4">A página do seu cliente foi gerada e salva no servidor.</p>
            <div class="flex gap-4">
              <a href="/${slug}.html" target="_blank" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm transition">
                🔗 Visualizar Landing Page
              </a>
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
      </body>
      </html>
    `);

  } catch (error) {
    console.error("❌ Erro no endpoint:", error);
    res.status(500).send("Erro ao processar a geração com IA.");
  }
});

// Permite servir as páginas HTML geradas publicamente
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando localmente! Acesse: http://localhost:${PORT}`);
});
