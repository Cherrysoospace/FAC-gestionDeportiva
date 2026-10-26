-- Script manual para bases de datos ya existentes.
-- No se ejecuta automáticamente. Es idempotente: se puede correr más de una vez.
--
-- Ejecutar con el cliente de MySQL:
--   mysql -u root -p security_ms_db < oauth_users.sql

ALTER TABLE users
    MODIFY COLUMN password VARCHAR(255) NULL;

UPDATE users
SET auth_provider = 'LOCAL'
WHERE auth_provider IS NULL OR auth_provider = '';

UPDATE users
SET enabled = 1
WHERE enabled IS NULL;

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

DROP PROCEDURE IF EXISTS add_unique_if_missing$$
CREATE PROCEDURE add_unique_if_missing(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND INDEX_NAME = p_index
    ) THEN
        SET @sql = CONCAT(
            'ALTER TABLE `', p_table, '` ADD CONSTRAINT `',
            p_index, '` UNIQUE (', p_columns, ')'
        );
        PREPARE statement FROM @sql;
        EXECUTE statement;
        DEALLOCATE PREPARE statement;
    END IF;
END$$

DELIMITER ;

CALL add_column_if_missing(
    'users',
    'auth_provider',
    'VARCHAR(50) NOT NULL DEFAULT ''LOCAL'''
);
CALL add_column_if_missing(
    'users',
    'external_id',
    'VARCHAR(255) NULL'
);
CALL add_column_if_missing(
    'users',
    'enabled',
    'TINYINT(1) NOT NULL DEFAULT 1'
);
CALL add_unique_if_missing(
    'users',
    'uk_users_auth_provider_external_id',
    'auth_provider, external_id'
);

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_unique_if_missing;

INSERT INTO roles (name, description)
SELECT 'AFICIONADO', 'Usuario aficionado con permisos mínimos'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'AFICIONADO'
);
