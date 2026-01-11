-- =====================================================
-- MIGRACIÓN: Agregar columnas de traducción al inglés
-- Fecha: 2025-12-30
-- Descripción: Agrega columnas _en para contenido bilingüe
-- =====================================================

-- 1. Agregar columnas de traducción a la tabla 'services'
ALTER TABLE services
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- 2. Agregar columnas de traducción a la tabla 'blog_posts'
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- 3. Agregar comentarios para documentación
COMMENT ON COLUMN services.name_en IS 'English translation of service name';
COMMENT ON COLUMN services.description_en IS 'English translation of service description';
COMMENT ON COLUMN services.content_en IS 'English translation of service content';
COMMENT ON COLUMN blog_posts.title_en IS 'English translation of blog post title';
COMMENT ON COLUMN blog_posts.content_en IS 'English translation of blog post content';

-- 4. Verificar que las columnas se crearon correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'services' 
    AND column_name LIKE '%_en'
ORDER BY 
    ordinal_position;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'blog_posts' 
    AND column_name LIKE '%_en'
ORDER BY 
    ordinal_position;

-- =====================================================
-- MIGRACIÓN COMPLETADA
-- Si ves las columnas listadas arriba, la migración fue exitosa
-- =====================================================
