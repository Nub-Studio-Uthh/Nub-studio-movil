-- =====================================================================
-- 01 · ROLES
-- El backend abre una conexión por rol (src/config/db.js): usr_admin,
-- usr_artista, usr_cliente y usr_visitante. Aquí se crean con una
-- contraseña que solo existe en este entorno temporal; no es la de
-- producción ni la de ninguna base local.
-- Si el rol ya existe (por ejemplo, al repetir la carga), solo se le
-- actualiza la contraseña.
-- =====================================================================
\set ON_ERROR_STOP on

DO $$
DECLARE
  rol text;
BEGIN
  FOREACH rol IN ARRAY ARRAY['usr_admin', 'usr_artista', 'usr_cliente', 'usr_visitante'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
      EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', rol, 'entorno_ci');
    ELSE
      EXECUTE format('ALTER ROLE %I LOGIN PASSWORD %L', rol, 'entorno_ci');
    END IF;
  END LOOP;
END $$;
