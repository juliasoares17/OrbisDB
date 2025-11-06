import express from "express";
import bcrypt from "bcrypt";
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT
});

db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL: ", err);
        return;
    }
    console.log("Conexão MySQL bem-sucedida!");
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando!");
});

app.post("/cadastro", async (req, res) => {
    const {nome, email, senha} = req.body;
    db.query("SELECT * FROM usuario WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: "Erro no servidor: " + err });
        if (result.length > 0) return res.status(400).json({ error: "Email já cadastrado." });
        try {
            const saltRounds = 10;
            const hash = await bcrypt.hash(senha, saltRounds);
            db.query("INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)", [nome, email, hash], 
                (err) => {
                    if (err) return res.status(500).json({ error: "Erro ao salvar usuário: " + err });
                    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
            });
        } catch (error){
            res.status(500).json({ error: "Erro ao criptografar senha: " + error });
        };
    });
});

app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    db.query("SELECT * FROM usuario WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: "Erro no servidor" + err });
        if (result.length === 0) return res.status(400).json({ error: "Usuário não encontrado. "});
        const usuario = result[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) return res.status(401).json({ error: "Senha incorreta." })
        res.json({ message: "Login realizado com sucesso!", usuario: { id: usuario.id, nome: usuario.nome } })
    });
});
