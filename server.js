// Carrega as variáveis de ambiente (sua chave secreta)
require('dotenv').config(); 

const express = require('express');
const cors = require('cors'); // Para permitir chamadas do front-end
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("--- ERRO FATAL ---");
  console.error("A variável de ambiente 'GEMINI_API_KEY' não foi encontrada.");
  console.error("Por favor, verifique se:");
  console.error("  1. O arquivo .env existe na mesma pasta do server.js.");
  console.error("  2. O arquivo se chama exatamente '.env' (e não '.env.txt' ou 'env').");
  console.error("  3. Dentro do .env, a linha é: GEMINI_API_KEY=SUA_CHAVE_AQUI");
  process.exit(1); // Encerra o servidor
}

// --- Configuração ---
const app = express();
const PORT = process.env.PORT || 3000; // O servidor rodará na porta 3000

// Coloque ANTES de app.use(cors())
app.use((req, res, next) => {
  console.log(`[DEBUG] Recebida: ${req.method} ${req.url}`);
  next(); // Continua para o próximo middleware
});

// --- Middlewares ---
app.use(cors()); // Permite que seu site (ex: localhost) acesse este servidor
app.use(express.json()); // Permite ao servidor entender JSON

// --- Inicialização do Gemini ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Rota Principal da API ---
app.post('/chatAmina', async (req, res) => {
  // Pega a mensagem do usuário vinda do front-end (chat.js)
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Nenhuma mensagem fornecida.' });
  }

  try {
    // Inicializa o modelo de IA
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // ** Personalização Importante da Amina **
    // Define o "prompt" inicial do sistema para dar o contexto à IA
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: "Você é a Amina, uma IA assistente focada em dar apoio emocional a mulheres em situação de vulnerabilidade. Seu tom é calmo, acolhedor e empático. Você não é uma psicóloga, mas está aqui para ouvir e apoiar. Se a situação parecer uma emergência, você deve sugerir ligar para 190 (polícia) ou 180 (Central de Atendimento à Mulher)." }],
        },
        {
          role: 'model',
          parts: [{ text: "Entendido. Serei a Amina, uma amiga virtual acolhedora e empática, pronta para ouvir e apoiar. Se for uma emergência, recomendarei o 190 ou 180." }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    // Envia a mensagem do usuário para o chat da IA
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Envia a resposta do Gemini de volta para o front-end
    res.json({ reply: text });

  } catch (error) {
    console.error('Erro ao chamar a API do Gemini:', error);
    res.status(500).json({ error: 'Não consegui pensar em uma resposta agora.' });
  }
});

// --- Iniciar o Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor da Amina rodando em http://localhost:${PORT}`);
});