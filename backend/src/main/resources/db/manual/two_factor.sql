-- Script manual para bases de datos ya existentes (HU-SE-10).
-- Con spring.jpa.hibernate.ddl-auto=update las tablas se crean solas; este
-- script es para entornos donde no se usa. Es idempotente.
--
-- Ejecutar con el cliente de MySQL:
--   mysql -u root -p gestiondeportiva < two_factor.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing$$
CREATE PROCEDURE add_column_if_missing(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', p_table, '` ADD COLUMN `',
            p_column, '` ', p_definition
        );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
    END IF;
END$$

DELIMITER ;

CALL add_column_if_missing(
    'users',
    'two_factor_enabled',
    'TINYINT(1) NOT NULL DEFAULT 0'
);

DROP PROCEDURE IF EXISTS add_column_if_missing;

CREATE TABLE IF NOT EXISTS two_factor_challenges (
    id BIGINT NOT NULL AUTO_INCREMENT,
    challenge_hash VARCHAR(64) NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    last_sent_at DATETIME(6) NOT NULL,
    used_at DATETIME(6) NULL,
    cancelled_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_two_factor_challenges_challenge_hash UNIQUE (challenge_hash),
    INDEX idx_two_factor_challenges_user_id (user_id),
    CONSTRAINT fk_two_factor_challenges_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
