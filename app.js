const { config } = require('dotenv');

// Importando o módulo express
const express = require('express');

//importando handlebars
const { engine } = require ('express-handlebars');

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
    //obter os dados que serão utilizados para cadastro
    let nome = req.body.nome;
    let cpf = req.body.cpf;
    let email = req.body.email;
    let altura = req.body.altura_em_cm;
    let peso = req.body.peso_em_kg;

    //SQL
    let sql = `INSERT INTO ALUNOS (NOME, CPF, EMAIL, ALTURA, PESO) VALUES ('${nome}', '${cpf}', '${email}', ${altura}, ${peso})`;

    //executando o comando
    conexao.query(sql, function(erro, retorno){
        //erro
        if(erro) throw erro;

        //se deu certo
        console.log(retorno);

    });

    //retornando para a rota principal
    res.redirect('/');
});

app.get('/gerenciamento', function (req, res) {
    //SQL 
    let sql = 'SELECT * FROM ALUNOS';

    conexao.query (sql, function (erro, retorno){
        res.render('gerente', {alunos:retorno});
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

// Criando servidor
app.listen(8080, () => {
    console.log('Servidor rodando na porta 8080');
});