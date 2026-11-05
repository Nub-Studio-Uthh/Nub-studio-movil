-- =====================================================================
-- 05 · SECUENCIAS
-- Ajusta cada secuencia al id más alto que dejaron los datos de prueba,
-- para que los INSERT nuevos (favoritos, carrito, registros) no choquen.
-- =====================================================================
\set ON_ERROR_STOP on
DO $$
DECLARE s record; m bigint;
BEGIN
  FOR s IN
    SELECT d.refobjid::regclass AS tabla, a.attname AS col, d.objid::regclass AS seq
    FROM pg_depend d JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    WHERE d.classid = 'pg_class'::regclass AND d.deptype IN ('a','i')
      AND (SELECT relkind FROM pg_class WHERE oid = d.objid) = 'S'
  LOOP
    EXECUTE format('SELECT max(%I) FROM %s', s.col, s.tabla) INTO m;
    PERFORM setval(s.seq, coalesce(m, 0) + 1, false);
  END LOOP;
END $$;
