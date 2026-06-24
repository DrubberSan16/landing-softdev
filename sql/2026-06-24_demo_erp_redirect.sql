BEGIN;

-- Apunta el proyecto Demo ERP existente a la mini aplicacion ERP incluida
-- en este mismo frontend. No inserta proyectos nuevos.
--
-- URL de produccion recomendada:
-- https://softwareeasydev.com/demo-erp
--
-- Para probar localmente, configura manualmente:
-- http://localhost:5173/demo-erp

UPDATE landing_core.tb_projects
SET
    demo_url = 'https://softwareeasydev.com/demo-erp',
    updated_at = NOW()
WHERE slug IN ('demo-erp-comercial', 'demo-erp')
  AND deleted_at IS NULL;

COMMIT;
