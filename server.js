
const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json({ limit: "10kb" }));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Teste para saber se o servidor está funcionando
app.get("/", (req, res) => {
    res.json({
        status: "online",
        projeto: "AI Builder Roblox"
    });
});

// Receber pedidos de construção
app.post("/construir", async (req, res) => {
    try {
        const pedido = req.body.pedido;

        if (
            typeof pedido !== "string" ||
            pedido.trim().length < 3 ||
            pedido.length > 500
        ) {
            return res.status(400).json({
                erro: "Pedido inválido."
            });
        }

        const resposta = await openai.responses.create({
            model: "gpt-4.1-mini",

            instructions: `
Você é uma IA construtora para Roblox Studio.

Sua função é transformar pedidos em construções
usando peças básicas do Roblox.

Responda somente com JSON válido neste formato:

{
  "pecas": [
    {
      "nome": "Base",
      "x": 0,
      "y": 1,
      "z": 0,
      "sx": 10,
      "sy": 1,
      "sz": 10,
      "cor": "Gray"
    }
  ]
}

REGRAS:
- Máximo de 40 peças.
- Coordenadas entre -100 e 100.
- Tamanhos entre 1 e 40.
- Use somente estas cores:
Red, Blue, White, Black, Green,
Yellow, Brown e Gray.
- Não gere scripts.
- Não escreva explicações fora do JSON.
- Todas as peças devem ser Anchored.
`,

            input: pedido
        });

        const dados = JSON.parse(resposta.output_text);

        if (
            !dados ||
            !Array.isArray(dados.pecas) ||
            dados.pecas.length > 40
        ) {
            throw new Error("Resposta inválida.");
        }

        const coresPermitidas = [
            "Red", "Blue", "White", "Black",
            "Green", "Yellow", "Brown", "Gray"
        ];

        const pecas = dados.pecas.map(p => {
            const numeros = [
                p.x, p.y, p.z,
                p.sx, p.sy, p.sz
            ];

            if (!numeros.every(Number.isFinite)) {
                throw new Error("Número inválido.");
            }

            if (
                Math.abs(p.x) > 100 ||
                Math.abs(p.y) > 100 ||
                Math.abs(p.z) > 100 ||
                p.sx < 1 || p.sx > 40 ||
                p.sy < 1 || p.sy > 40 ||
                p.sz < 1 || p.sz > 40 ||
                !coresPermitidas.includes(p.cor)
            ) {
                throw new Error("Peça fora dos limites.");
            }

            return {
                nome: String(p.nome || "Bloco").slice(0, 40),
                x: p.x,
                y: p.y,
                z: p.z,
                sx: p.sx,
                sy: p.sy,
                sz: p.sz,
                cor: p.cor
            };
        });

        res.json({ pecas });

    } catch (erro) {
        console.error("Erro:", erro.message);

        res.status(500).json({
            erro: "Erro ao gerar construção."
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("AI Builder iniciado na porta " + PORT);
});
