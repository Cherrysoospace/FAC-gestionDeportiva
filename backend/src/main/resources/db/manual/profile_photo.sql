-- Script manual para bases de datos ya existentes (HU-SE-02).
-- No se ejecuta automáticamente. Es idempotente: se puede correr más de una vez.
--
-- ddl-auto=update agrega la columna photo_url, pero no quita el NOT NULL
-- de phone y birth_date. Sin este script, guardar solo la foto falla.
--
-- Ejecutar con el cliente de MySQL:
--   mysql -u root -p gestiondeportiva < profile_photo.sql

ALTER TABLE profiles
    MODIFY COLUMN phone VARCHAR(30) NULL;

ALTER TABLE profiles
    MODIFY COLUMN birth_date DATE NULL;
