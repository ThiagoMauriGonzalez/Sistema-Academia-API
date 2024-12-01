DROP TRIGGER atualizar_relatorio_entrada_saida;

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
