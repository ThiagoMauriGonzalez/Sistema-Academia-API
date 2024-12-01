CREATE DATABASE PROJETO02;
SHOW DATABASES;
USE PROJETO02;

DROP TABLE RELATORIO;
DROP TABLE CATRACA;
DROP TABLE ALUNOS;

SHOW TABLES;

SELECT * FROM ALUNOS;
TRUNCATE ALUNOS;

SELECT * FROM CATRACA;
TRUNCATE CATRACA;

SELECT * FROM RELATORIO;
TRUNCATE RELATORIO;

CREATE TABLE ALUNOS (
    MATRICULA INT AUTO_INCREMENT PRIMARY KEY,
    NOME VARCHAR(100) NOT NULL,
    CPF VARCHAR (15) NOT NULL UNIQUE,
    EMAIL VARCHAR(100) NOT NULL UNIQUE,
    ALTURA INT NOT NULL,
    PESO INT NOT NULL
);

CREATE TABLE CATRACA (
    ID_CATRACA INT AUTO_INCREMENT PRIMARY KEY,
    ID_ALUNO INT NOT NULL,
    HORARIO_INICIO DATETIME NOT NULL,
    HORARIO_SAIDA DATETIME NULL,
    CONSTRAINT FK_ID_ALUNO FOREIGN KEY (ID_ALUNO) REFERENCES ALUNOS(MATRICULA)
);
    
CREATE TABLE RELATORIO (
    ID_RELATORIO INT AUTO_INCREMENT PRIMARY KEY,
    ID_ALUNO INT NOT NULL,
    HORAS_TOTAIS TIME NOT NULL DEFAULT '00:00:00',
    HORAS_SEMANAIS TIME NOT NULL DEFAULT '00:00:00',
    CLASSIFICACAO_TOTAL VARCHAR(50) NOT NULL DEFAULT 'Iniciante',
    CLASSIFICACAO_SEMANAL VARCHAR(50) NOT NULL DEFAULT 'Iniciante',
    CONSTRAINT FK_ALUNO_HORAS
        FOREIGN KEY (ID_ALUNO)
        REFERENCES ALUNOS (MATRICULA)
);

-- Inserção de registro para o aluno 1 no dia 24/11/2024 (3 horas)
INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO, HORARIO_SAIDA) 
VALUES 
(1, '2024-11-24 09:00:00', '2024-11-24 12:00:00');
-- Inserção de registro para o aluno 1 no dia 26/11/2024 (3,5 horas)
INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO, HORARIO_SAIDA) 
VALUES 
(1, '2024-11-26 10:00:00', '2024-11-26 13:30:00');
-- Inserção de registro para o aluno 1 no dia 28/11/2024 (3 horas)
INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO, HORARIO_SAIDA) 
VALUES 
(1, '2024-11-28 14:00:00', '2024-11-28 17:00:00');

-- Inserção de registro para o aluno 1 no dia 15/10/2024 (4 horas)
INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO, HORARIO_SAIDA) 
VALUES 
(1, '2024-10-15 08:30:00', '2024-10-15 12:30:00');
-- Inserção de registro para o aluno 1 no dia 30/09/2024 (4 horas)
INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO, HORARIO_SAIDA) 
VALUES 
(1, '2024-09-30 07:00:00', '2024-09-30 11:00:00');


-- Atualizando o relatório do aluno 1 após os novos registros
UPDATE RELATORIO 
SET 
    HORAS_TOTAIS = (
        SELECT SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))) 
        FROM CATRACA 
        WHERE ID_ALUNO = 1
    ),
    HORAS_SEMANAIS = (
        SELECT SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))) 
        FROM CATRACA 
        WHERE ID_ALUNO = 1 
        AND HORARIO_INICIO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ),
    CLASSIFICACAO_TOTAL = (
        CASE 
            WHEN (
                SELECT SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))
                FROM CATRACA 
                WHERE ID_ALUNO = 1
            ) >= 36000 THEN 'Avançado'  -- 10 horas em segundos
            WHEN (
                SELECT SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))
                FROM CATRACA 
                WHERE ID_ALUNO = 1
            ) >= 18000 THEN 'Intermediário'  -- 5 horas em segundos
            ELSE 'Iniciante' 
        END
    ),
    CLASSIFICACAO_SEMANAL = (
        CASE 
            WHEN (
                SELECT SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))
                FROM CATRACA 
                WHERE ID_ALUNO = 1 
                AND HORARIO_INICIO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) >= 18000 THEN 'Avançado'  -- 5 horas em segundos
            WHEN (
                SELECT SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))
                FROM CATRACA 
                WHERE ID_ALUNO = 1 
                AND HORARIO_INICIO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) >= 9000 THEN 'Intermediário'  -- 2,5 horas em segundos
            ELSE 'Iniciante' 
        END
    )
WHERE ID_ALUNO = 1;

-- Inserção de registros para o aluno 2 para classificação semanal (últimos 7 dias)
INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO, HORARIO_SAIDA) 
VALUES 
(2, '2024-11-24 08:00:00', '2024-11-24 11:00:00'), -- 3 horas no dia 24/11/2024
(2, '2024-11-27 09:30:00', '2024-11-27 12:00:00'), -- 2,5 horas no dia 27/11/2024
(2, '2024-11-29 14:00:00', '2024-11-29 17:30:00'); -- 3,5 horas no dia 29/11/2024

-- Inserção de registros para o aluno 2 para classificação total (qualquer data)
INSERT INTO CATRACA (ID_ALUNO, HORARIO_INICIO, HORARIO_SAIDA) 
VALUES 
(2, '2024-08-20 08:00:00', '2024-08-20 12:00:00'), -- 4 horas no dia 20/08/2024
(2, '2024-06-10 07:00:00', '2024-06-10 10:00:00'); -- 3 horas no dia 10/06/2024


-- Selecionar as horas totais e semanais somadas do último registro de cada aluno
SELECT 
    A.MATRICULA,
    A.NOME,
    SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(C.HORARIO_SAIDA, C.HORARIO_INICIO)))) AS HORAS_TOTAIS,
    SEC_TO_TIME(SUM(
        CASE 
            WHEN C.HORARIO_INICIO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            THEN TIME_TO_SEC(TIMEDIFF(C.HORARIO_SAIDA, C.HORARIO_INICIO))
            ELSE 0
        END
    )) AS HORAS_SEMANAIS,
    CASE
        WHEN SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(C.HORARIO_SAIDA, C.HORARIO_INICIO)))) >= '10:00:00' THEN 'Avançado'
        WHEN SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(C.HORARIO_SAIDA, C.HORARIO_INICIO)))) >= '5:00:00' THEN 'Intermediário'
        ELSE 'Iniciante'
    END AS CLASSIFICACAO_TOTAL,
    CASE
        WHEN SEC_TO_TIME(SUM(
                CASE 
                    WHEN C.HORARIO_INICIO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    THEN TIME_TO_SEC(TIMEDIFF(C.HORARIO_SAIDA, C.HORARIO_INICIO))
                    ELSE 0
                END
            )) >= '5:00:00' THEN 'Avançado'
        WHEN SEC_TO_TIME(SUM(
                CASE 
                    WHEN C.HORARIO_INICIO >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    THEN TIME_TO_SEC(TIMEDIFF(C.HORARIO_SAIDA, C.HORARIO_INICIO))
                    ELSE 0
                END
            )) >= '2:30:00' THEN 'Intermediário'
        ELSE 'Iniciante'
    END AS CLASSIFICACAO_SEMANAL
FROM 
    ALUNOS A
JOIN 
    CATRACA C ON A.MATRICULA = C.ID_ALUNO
WHERE 
    C.ID_CATRACA = (SELECT MAX(ID_CATRACA) FROM CATRACA WHERE ID_ALUNO = A.MATRICULA)
GROUP BY 
    A.MATRICULA, A.NOME;

DELIMITER $$

CREATE TRIGGER atualizar_relatorio_entrada_saida
AFTER INSERT ON CATRACA
FOR EACH ROW
BEGIN
    DECLARE tempo_total TIME;
    DECLARE tempo_semanal TIME;
    DECLARE classificacao_total VARCHAR(50);
    DECLARE classificacao_semanal VARCHAR(50);

    -- Calculando as horas totais
    SELECT SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))) 
    INTO tempo_total
    FROM CATRACA
    WHERE ID_ALUNO = NEW.ID_ALUNO AND HORARIO_SAIDA IS NOT NULL;

    -- Calculando as horas semanais (últimos 7 dias)
    SELECT SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(HORARIO_SAIDA, HORARIO_INICIO)))) 
    INTO tempo_semanal
    FROM CATRACA
    WHERE ID_ALUNO = NEW.ID_ALUNO 
      AND HORARIO_SAIDA IS NOT NULL
      AND HORARIO_INICIO >= CURDATE() - INTERVAL 7 DAY;

    -- Classificação de horas totais
    IF TIME_TO_SEC(tempo_total) <= 18000 THEN
        SET classificacao_total = 'Iniciante';
    ELSEIF TIME_TO_SEC(tempo_total) > 18000 AND TIME_TO_SEC(tempo_total) <= 36000 THEN
        SET classificacao_total = 'Intermediário';
    ELSEIF TIME_TO_SEC(tempo_total) > 36000 AND TIME_TO_SEC(tempo_total) <= 72000 THEN
        SET classificacao_total = 'Avançado';
    ELSE
        SET classificacao_total = 'Extremamente Avançado';
    END IF;

    -- Classificação de horas semanais
    IF TIME_TO_SEC(tempo_semanal) <= 18000 THEN
        SET classificacao_semanal = 'Iniciante';
    ELSEIF TIME_TO_SEC(tempo_semanal) > 18000 AND TIME_TO_SEC(tempo_semanal) <= 36000 THEN
        SET classificacao_semanal = 'Intermediário';
    ELSEIF TIME_TO_SEC(tempo_semanal) > 36000 AND TIME_TO_SEC(tempo_semanal) <= 72000 THEN
        SET classificacao_semanal = 'Avançado';
    ELSE
        SET classificacao_semanal = 'Extremamente Avançado';
    END IF;

    -- Atualizando a tabela RELATORIO
    INSERT INTO RELATORIO (ID_ALUNO, HORAS_TOTAIS, HORAS_SEMANAIS, CLASSIFICACAO_TOTAL, CLASSIFICACAO_SEMANAL)
    VALUES (NEW.ID_ALUNO, tempo_total, tempo_semanal, classificacao_total, classificacao_semanal)
    ON DUPLICATE KEY UPDATE 
        HORAS_TOTAIS = tempo_total, 
        HORAS_SEMANAIS = tempo_semanal,
        CLASSIFICACAO_TOTAL = classificacao_total,
        CLASSIFICACAO_SEMANAL = classificacao_semanal;
    
END $$

DELIMITER ;
