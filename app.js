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

 //ENTRADA da catraca    
app.post('/registroentrada', function (req, res) {
    let matricula = req.body.matricula;
    // Ajustando o horário para o fuso horário local (UTC-3)
    let horaEntrada = new Date();
    // horaEntrada.setHours(horaEntrada.getHours() -3); // Removido para evitar a adição de 3 horas
    horaEntrada = horaEntrada.toISOString().slice(0, 19).replace('T', ' ');

    // Primeiro verifica se o aluno existe
    let sqlVerificaAluno = `SELECT * FROM ALUNOS WHERE MATRICULA = ?`;
    
    conexao.query(sqlVerificaAluno, [matricula], function(erro, retornoAluno) {
        if (erro) {
            console.error('Erro ao verificar matrícula:', erro);
            return res.status(500).json({ mensagem: 'Erro ao verificar matrícula' });
        }

        if (retornoAluno.length === 0) {
            return res.status(404).json({ mensagem: 'Aluno não encontrado' });
        }

        // Verifica se já existe uma entrada sem saída
        let sqlVerificaEntrada = `SELECT * FROM CATRACA WHERE ID_ALUNO = ? AND HORARIO_SAIDA IS NULL`;
        
        conexao.query(sqlVerificaEntrada, [matricula], function(erro, retornoEntrada) {
            if (erro) {
                console.error('Erro ao verificar entrada:', erro);
                return res.status(500).json({ mensagem: 'Erro ao verificar entrada existente' });
            }

            if (retornoEntrada.length > 0) {
                // Ajustando o horário da entrada existente para o fuso horário local
                const horaEntradaLocal = new Date(retornoEntrada[0].HORARIO_INICIO);
                horaEntradaLocal.setHours(horaEntradaLocal.getHours() );
                
                return res.status(400).json({ 
                    mensagem: 'Aluno já possui entrada registrada',
                    entradaExistente: true,
                    horaEntrada: horaEntradaLocal
                });
            }

            let sql = `INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO) VALUES (?, ?)`;

            conexao.query(sql, [matricula, horaEntrada], function (erro, retorno) {
                if (erro) {
                    console.error('Erro ao registrar entrada:', erro);
                    return res.status(500).json({ mensagem: 'Erro ao registrar entrada' });
                }

                // Verifica se já existe registro na tabela RELATORIO
                let sqlVerificaRelatorio = `SELECT * FROM RELATORIO WHERE ID_ALUNO = ?`;
                conexao.query(sqlVerificaRelatorio, [matricula], function(erro, retornoRelatorio) {
                    if (erro) {
                        console.error('Erro ao verificar relatório:', erro);
                        return res.status(500).json({ mensagem: 'Erro ao verificar relatório' });
                    }

                    if (retornoRelatorio.length === 0) {
                        // Se não existe, insere novo registro
                        let sqlInsertRelatorio = `INSERT INTO RELATORIO (ID_ALUNO) VALUES (?)`;
                        conexao.query(sqlInsertRelatorio, [matricula], function(erro) {
                            if (erro) {
                                console.error('Erro ao criar relatório:', erro);
                                return res.status(500).json({ mensagem: 'Erro ao criar relatório' });
                            }
                        });
                    }
                });

                return res.status(200).json({ 
                    mensagem: 'Entrada registrada com sucesso',
                    aluno: retornoAluno[0].NOME
                });
            });
        });
    });
});

//SAIDA da catraca
app.post('/registrosaida', function (req, res) {
    let matricula = req.body.matricula;
    let horaSaida = new Date();
    horaSaida.setSeconds(horaSaida.getSeconds()); // Corrigido para registrar os segundos
    horaSaida.setMinutes(horaSaida.getMinutes());
    horaSaida.setHours(horaSaida.getHours()); // Removido a subtração de 3 horas
    horaSaida = horaSaida.toISOString().slice(0, 19).replace('T', ' ');

    // Primeiro verifica se o aluno existe
    let sqlVerificaAluno = `SELECT * FROM ALUNOS WHERE MATRICULA = ?`;
    
    conexao.query(sqlVerificaAluno, [matricula], function(erro, retornoAluno) {
        if (erro) {
            console.error('Erro ao verificar matrícula:', erro);
            return res.status(500).json({ mensagem: 'Erro ao verificar matrícula' });
        }

        if (retornoAluno.length === 0) {
            return res.status(404).json({ mensagem: 'Aluno não encontrado' });
        }

        let sql = `UPDATE CATRACA SET HORARIO_SAIDA = ? 
                   WHERE ID_ALUNO = ? 
                   AND HORARIO_SAIDA IS NULL 
                   ORDER BY HORARIO_INICIO DESC LIMIT 1`;

        conexao.query(sql, [horaSaida, matricula], function (erro, retorno) {
            if (erro) {
                console.error('Erro ao registrar saída:', erro);
                return res.status(500).json({ mensagem: 'Erro ao registrar saída' });
            }
            
            if (retorno.affectedRows === 0) {
                return res.status(400).json({ mensagem: 'Não há entrada registrada para este aluno' });
            }

            // Calcula tempo total e atualiza relatório
            let sqlTempoTotal = `
                SELECT 
                    SEC_TO_TIME(SUM(
                        TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO))
                    )) as tempo_total,
                    SEC_TO_TIME(SUM(
                        CASE 
                            WHEN HORARIO_INICIO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                            THEN TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO))
                            ELSE 0
                        END
                    )) as tempo_semanal
                FROM CATRACA 
                WHERE ID_ALUNO = ? AND HORARIO_SAIDA IS NOT NULL`;

            conexao.query(sqlTempoTotal, [matricula], function(erro, retornoTempo) {
                if (erro) {
                    console.error('Erro ao calcular tempo:', erro);
                    return res.status(500).json({ mensagem: 'Erro ao calcular tempo' });
                }

                let tempoTotal = retornoTempo[0].tempo_total;
                let tempoSemanal = retornoTempo[0].tempo_semanal;

                // Define classificação baseada no tempo semanal
                function calcularClassificacao(tempo) {
                    let horas = parseInt(tempo.split(':')[0]); // Extrair horas da string 'HH:MM:SS'
                
                    if (horas <= 5) return 'Iniciante';
                    if (horas > 5 && horas <= 10) return 'Intermediário';
                    if (horas > 10 && horas <= 20) return 'Avançado';
                    return 'Extremamente Avançado';
                }

                // Após o cálculo de tempo total e semanal
                let classificacaoTotal = calcularClassificacao(tempoTotal);
                let classificacaoSemanal = calcularClassificacao(tempoSemanal);

                // Atualiza o relatório com as classificações
                let sqlUpdateRelatorio = `
                    UPDATE RELATORIO 
                    SET 
                        HORAS_TOTAIS = ?,
                        HORAS_SEMANAIS = ?,
                        CLASSIFICACAO_TOTAL = ?,  -- Coluna adicional para classificação de horas totais
                        CLASSIFICACAO_SEMANAL = ?  -- Coluna adicional para classificação de horas semanais
                    WHERE ID_ALUNO = ?`;

                conexao.query(sqlUpdateRelatorio, [tempoTotal, tempoSemanal, classificacaoTotal, classificacaoSemanal, matricula], function(erro) {
                    if (erro) {
                        console.error('Erro ao atualizar relatório:', erro);
                        return res.status(500).json({ mensagem: 'Erro ao atualizar relatório' });
                    }
                    
                    return res.status(200).json({ 
                        mensagem: 'Saída registrada com sucesso',
                        aluno: retornoAluno[0].NOME
                    });
                });
            });
        });
    });
});


app.get('/loginRelatorio', function (req, res) {
    res.render('loginRelatorio');
});

app.post('/relatorioAluno', async function (req, res) {
    let matricula = req.body.matricula;

    try {
        // Promessa para a primeira query
        const alunoQuery = new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM ALUNOS WHERE MATRICULA = ?';
            conexao.query(sql, [matricula], (erro, resultado) => {
                if (erro) return reject(erro);
                resolve(resultado);
            });
        });

        // Promessa para a segunda query
        const relatorioQuery = new Promise((resolve, reject) => {
            let sqlhoras = 'SELECT HORAS_SEMANAIS, CLASSIFICACAO_SEMANAL FROM RELATORIO WHERE ID_ALUNO = ?';
            conexao.query(sqlhoras, [matricula], (erro, resultado) => {
                if (erro) return reject(erro);
                resolve(resultado);
            });
        });

        // Executa as duas queries
        const [dadosAluno, dadosRelatorio] = await Promise.all([alunoQuery, relatorioQuery]);

        // Verifica os resultados e renderiza o template
        if (dadosAluno.length > 0 && dadosRelatorio.length > 0) {
            res.render('relatorioAluno', {
                MATRICULA: dadosAluno[0].MATRICULA,
                NOME: dadosAluno[0].NOME,
                CPF: dadosAluno[0].CPF,
                EMAIL: dadosAluno[0].EMAIL,
                ALTURA: dadosAluno[0].ALTURA,
                PESO: dadosAluno[0].PESO,
                HORAS_SEMANAIS: dadosRelatorio[0].HORAS_SEMANAIS,
                CLASSIFICACAO_SEMANAL: dadosRelatorio[0].CLASSIFICACAO_SEMANAL
            });
        } else {
            res.send('Aluno ou relatório não encontrado');
        }
    } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
        res.status(500).send('Erro interno do servidor');
    }
});

app.get('/gerenciamento', function (req, res) {
    res.render('gerente');
});

app.get('/gerenciamentosemanal', function (req, res) {
    // Consulta SQL combinada (LEFT JOIN para incluir todos os alunos, mesmo sem relatório)
    let sql = `
        WITH UltimosRegistros AS (
    SELECT 
        ID_ALUNO,
        HORAS_TOTAIS,
        HORAS_SEMANAIS,
        CLASSIFICACAO_TOTAL,
        CLASSIFICACAO_SEMANAL,
        ROW_NUMBER() OVER (PARTITION BY ID_ALUNO ORDER BY ID_RELATORIO DESC) AS rn
    FROM 
    RELATORIO
    )
    SELECT 
        A.MATRICULA,
        A.NOME,
        R.HORAS_TOTAIS,
        R.HORAS_SEMANAIS,
        R.CLASSIFICACAO_TOTAL,
        R.CLASSIFICACAO_SEMANAL
    FROM 
        UltimosRegistros R
    INNER JOIN 
        ALUNOS A ON R.ID_ALUNO = A.MATRICULA
    WHERE 
        R.rn = 1
    ORDER BY 
        CAST(SUBSTRING_INDEX(R.HORAS_SEMANAIS, ':', 1) AS UNSIGNED) DESC,  -- Ordena pelas horas semanais (parte das horas)
        CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(R.HORAS_SEMANAIS, ':', -2), ':', 1) AS UNSIGNED) DESC; -- Ordena os minutos

    `;

    // Executa a consulta
    conexao.query(sql, function(erro, resultados) {
        if (erro) {
            console.error('Erro ao executar consulta:', erro);
            return res.status(500).send('Erro no servidor');
        }

        // Verifica se há resultados
        if (resultados.length === 0) {
            return res.send('Nenhum dado encontrado.');
        }

        // Renderiza o template com os dados combinados
        res.render('gerentesemanal', { alunos: resultados });
    });
});


app.get('/gerenciamentototal', function (req, res) {
    // Consulta SQL combinada (LEFT JOIN para incluir todos os alunos, mesmo sem relatório)
    let sql = `
        WITH UltimosRegistros AS (
    SELECT 
        ID_ALUNO,
        HORAS_TOTAIS,
        HORAS_SEMANAIS,
        CLASSIFICACAO_TOTAL,
        CLASSIFICACAO_SEMANAL,
        ROW_NUMBER() OVER (PARTITION BY ID_ALUNO ORDER BY ID_RELATORIO DESC) AS rn
    FROM 
        RELATORIO
    )
    SELECT 
        A.MATRICULA,
        A.NOME,
        R.HORAS_TOTAIS,
        R.HORAS_SEMANAIS,
        R.CLASSIFICACAO_TOTAL,
        R.CLASSIFICACAO_SEMANAL
    FROM 
        UltimosRegistros R
    INNER JOIN 
        ALUNOS A ON R.ID_ALUNO = A.MATRICULA
    WHERE 
        R.rn = 1
    ORDER BY 
        CAST(SUBSTRING_INDEX(R.HORAS_TOTAIS, ':', 1) AS UNSIGNED) DESC,  -- Ordena pelas horas totais (parte das horas)
        CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(R.HORAS_TOTAIS, ':', -2), ':', 1) AS UNSIGNED) DESC; -- Ordena os minutos

    `;

    // Executa a consulta
    conexao.query(sql, function(erro, resultados) {
        if (erro) {
            console.error('Erro ao executar consulta:', erro);
            return res.status(500).send('Erro no servidor');
        }

        // Verifica se há resultados
        if (resultados.length === 0) {
            return res.send('Nenhum dado encontrado.');
        }

        // Renderiza o template com os dados combinados
        res.render('gerentetotal', { alunos: resultados });
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
 