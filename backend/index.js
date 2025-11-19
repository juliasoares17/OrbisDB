import { PrismaClient } from "@prisma/client";
import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const prisma = new PrismaClient();
const app = express();
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true, 
}));

app.use(express.json());

function bigIntJsonReplacer(key, value) {
    // Verifica se o valor é um BigInt e o converte para String
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

app.use((req, res, next) => {
    // Sobrescreve o método json nativo do Express
    res.json = function (body) {
        if (body !== undefined) {
            this.send(JSON.stringify(body, bigIntJsonReplacer));
        } else {
            this.send();
        }
    };
    next();
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando!");
});

app.post("/cadastro", async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({ error: "Email já cadastrado." });
        }

        const hash = await bcrypt.hash(senha, 10);

        await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: hash
            }
        });

        return res.status(201).json({ message: "Usuário cadastrado com sucesso!" });

    } catch (err) {
        return res.status(500).json({ error: "Erro no servidor: " + err });
    }
});


app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario) {
            return res.status(400).json({ error: "Usuário não encontrado." });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ error: "Senha incorreta." });
        }

        return res.json({
            message: "Login realizado com sucesso!",
            usuario: {
                id: usuario.id,
                nome: usuario.nome
            }
        });

    } catch (err) {
        return res.status(500).json({ error: "Erro no servidor: " + err });
    }
});

process.on("SIGINT", async () => {
  console.log("Desconectando Prisma antes de sair...");
  await prisma.$disconnect();
  process.exit(0);
});

//CRUD de Continentes
app.post("/continentes", async (req, res) => {
    const { nome, descricao, area_km2, numero_paises, populacao_total } = req.body;
    if (!nome || !descricao) {
        return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
    }
    try {
        const novoContinente = await prisma.continente.create({
            data: {
                nome,
                descricao,
                area_km2: area_km2 ? Number(area_km2) : undefined,
                numero_paises: numero_paises ? Number(numero_paises) : undefined,
                populacao_total: populacao_total ? BigInt(populacao_total) : undefined,
            },
        });
        return res.status(201).json(novoContinente);
    } catch (err) {
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe um continente com este nome." });
        }
        console.error("Erro ao criar continente:", err);
        return res.status(500).json({ error: "Erro interno ao cadastrar continente." });
    }
});

app.get("/continentes", async (req, res) => { 
    try {
        const continentes = await prisma.continente.findMany({
            orderBy: { nome: 'asc' }
        });
        return res.json(continentes);
    } catch (err) {
        console.error("Erro ao listar continentes:", err);
        return res.status(500).json({ error: "Erro interno ao listar continentes." });
    }
});

app.put("/continentes/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dados = req.body;

    try {
        const continenteAtualizado = await prisma.continente.update({
            where: { id },
            data: dados,
        });
        return res.json(continenteAtualizado);
    } catch (err) {
        if (err.code === 'P2025') { 
            return res.status(404).json({ error: "Continente não encontrado." });
        }
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe um continente com este nome." });
        }
        console.error("Erro ao atualizar continente:", err);
        return res.status(500).json({ error: "Erro interno ao atualizar continente." });
    }
});

app.delete("/continentes/:id", async (req, res) => { 
    const id = Number(req.params.id);

    try {
        await prisma.continente.delete({
            where: { id },
        });
        return res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Continente não encontrado." });
        }
        console.error("Erro ao excluir continente:", err);
        return res.status(500).json({ error: "Erro interno ao excluir continente." });
    }
});

app.listen(Number(process.env.PORT), () => {
  console.log("Servidor rodando na porta " + process.env.PORT);
});



