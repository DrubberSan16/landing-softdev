BEGIN;

-- Cambio incremental para la generacion de documentacion comercial con OpenAI.
--
-- No se requieren cambios de esquema ni inserts de proyectos:
-- - El boton del panel administrativo llama al backend para analizar la URL del proyecto.
-- - La informacion generada se aplica sobre columnas existentes de landing_core.tb_projects:
--   short_description, full_description, meta_title, meta_description,
--   client_name y business_sector.
-- - KintiPorta ya debe existir como registro real del proyecto; este script no lo crea
--   ni lo sobrescribe para evitar duplicados o cambios no revisados.

COMMIT;
