//importando configuração do dotenv
const { config } = require('dotenv');


// Importando o módulo express
const express = require('express');


//importando handlebars
const { engine } = require('express-handlebars');


// Importando o módulo mysql
const mysql = require('mysql2');


const app = express();


//referenciando as pastas para uso
app.use('/css', express.static('./style'));
app.use('/javascript', express.static('./js'))
app.use('/image', express.static('./img'))



//configuração do handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');



// Manipulação de dados via rotas
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//configuração dotenv
config();

// Configuração de conexão com o banco
const conexao = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
});

// Teste de conexão
conexao.connect(function (erro) {
    if (erro) throw erro;
    console.log('Conexão efetuada com sucesso!');
});



// Rota principal
app.get('/', function (req, res) {
    res.render('index');
});


app.get('/cadastro', function (req, res) {
    res.render('cadastro');
});

// Rota de cadastro
app.post('/cadastrar', function (req, res) {
    let { nome, cpf, email, altura_em_cm, peso_em_kg } = req.body;

    // Verifica duplicidade de CPF
    let sqlVerificaCPF = `SELECT * FROM ALUNOS WHERE CPF = ?`;

    conexao.query(sqlVerificaCPF, [cpf], function (erro, retornoCPF) {
        if (erro) throw erro;

        // CPF já cadastrado
        if (retornoCPF.length > 0) {
            return res.status(400).json({ mensagem: 'CPF já cadastrado' });
        }

        // Verifica duplicidade de e-mail
        let sqlVerificaEmail = `SELECT * FROM ALUNOS WHERE EMAIL = ?`;

        conexao.query(sqlVerificaEmail, [email], function (erro, retornoEmail) {
            if (erro) throw erro;

            // E-mail já cadastrado
            if (retornoEmail.length > 0) {
                return res.status(400).json({ mensagem: 'E-mail já cadastrado' });
            }

            // SQL para inserção
            let sqlInsert = `INSERT INTO ALUNOS (NOME, CPF, EMAIL, ALTURA, PESO) VALUES (?, ?, ?, ?, ?)`;

            conexao.query(sqlInsert, [nome, cpf, email, altura_em_cm, peso_em_kg], function (erro, resultado) {
                if (erro) throw erro;

                // Retorna a matrícula (ID) gerada
                res.json({
                    matricula: resultado.insertId,
                });
            });
        });
    });
});


app.get('/catraca', function (req, res) {
    res.render('catraca');
});

app.post('/registroentrada', function (req, res) {

    let matricula = req.body.matricula;
    let horaent = req.getCurrentDateEntry();

    //SQL
    let sql = `INSERT INTO CATRACA (ID_ALUNO, HORARIO_INCIO) VALUES (${matricula}, ${horaent})`;

    //executando o comando
    conexao.query(sql, function (erro, retorno) {
        //erro
        if (erro) throw erro;

        //se deu certo
        console.log(retorno);

    });
});


app.post('/registrosaida', function (req, res) {

    let matricula = req.body.matricula;
    let horasaid = req.getCurrentDateExit();

    //SQL
    let sql = `INSERT INTO CATRACA (ID_ALUNO, HORARIO_SAIDA) VALUES (${matricula}, ${horasaid})`;

    //executando o comando
    conexao.query(sql, function (erro, retorno) {
        //erro
        if (erro) throw erro;

        //se deu certo
        console.log(retorno);

    });
});


app.get('/gerenciamento', function (req, res) {
    //SQL 
    let sql = 'SELECT * FROM ALUNOS';

    conexao.query(sql, function (erro, retorno) {
        res.render('gerente', { alunos: retorno });
    });
});


app.get('/users', function (req, res) {
    let querySelect = 'SELECT NOME FROM ALUNOS';

    conexao.query(querySelect, function (erro, retorno) {
        if (erro) throw erro;

        // Envia os dados no formato JSON
        res.json(retorno);
    });
});


app.get('/loginRelatorio', function (req, res) {
    res.render('loginRelatorio');
});

app.post('/relatorioAluno', function (req, res) {
    let matricula = req.body.matricula;

    // SQL para buscar os dados do aluno pela matrícula
    let sql = 'SELECT * FROM ALUNOS WHERE MATRICULA = ?';

    conexao.query(sql, [matricula], function (erro, retorno) {
        if (erro) throw erro;

        if (retorno.length > 0) {
            // Envia os dados do aluno para o template
            res.render('relatorioAluno', {
                MATRICULA: retorno[0].MATRICULA,
                NOME: retorno[0].NOME,
                CPF: retorno[0].CPF,
                EMAIL: retorno[0].EMAIL,
                ALTURA: retorno[0].ALTURA,
                PESO: retorno[0].PESO
            });
        } else {
            res.send('Aluno não encontrado');
        }
    });
});


// Criando servidor
app.listen(8080, () => {
    console.log('Servidor rodando na porta 8080');
});
