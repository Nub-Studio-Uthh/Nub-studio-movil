-- =====================================================================
-- 02 · ESQUEMA de la base de NU-B Studio (solo estructura, sin datos)
-- Tablas, secuencias, funciones, llaves, índices y triggers de la copia
-- limpia de producción del 21/10/2026. Los datos de prueba están en
-- 04-datos-prueba.sql y el ajuste de secuencias en 05-secuencias.sql.
-- =====================================================================
\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';
SET client_min_messages = warning;
BEGIN;

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipos (enums)
CREATE TYPE categoria_ticket AS ENUM ('soporte_tecnico', 'consulta', 'sugerencia', 'reclamo');
CREATE TYPE estado_comision AS ENUM ('pendiente', 'procesada', 'pagada', 'cancelada');
CREATE TYPE estado_ticket AS ENUM ('abierto', 'en_progreso', 'resuelto', 'cerrado');
CREATE TYPE estado_venta AS ENUM ('pendiente', 'pagado', 'procesando', 'enviado', 'entregado', 'cancelado');
CREATE TYPE prioridad_mensaje AS ENUM ('normal', 'alta');
CREATE TYPE prioridad_ticket AS ENUM ('baja', 'media', 'alta');
CREATE TYPE tipo_evento_login AS ENUM ('LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'LOGOUT', 'BLOQUEO', 'DESBLOQUEO', '2FA_EXITOSO', '2FA_FALLIDO');
CREATE TYPE tipo_red_social AS ENUM ('instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'website', 'pinterest', 'behance');

-- 3. Secuencias
CREATE SEQUENCE IF NOT EXISTS artistas_datos_bancarios_id_datos_bancarios_seq;
CREATE SEQUENCE IF NOT EXISTS artistas_fotos_personales_id_foto_seq;
CREATE SEQUENCE IF NOT EXISTS artistas_id_artista_seq;
CREATE SEQUENCE IF NOT EXISTS artistas_metodos_envio_id_metodo_envio_seq;
CREATE SEQUENCE IF NOT EXISTS artistas_portafolio_id_portafolio_seq;
CREATE SEQUENCE IF NOT EXISTS artistas_redes_sociales_id_red_seq;
CREATE SEQUENCE IF NOT EXISTS artistas_zonas_envio_id_zona_seq;
CREATE SEQUENCE IF NOT EXISTS backup_config_cron_id_seq;
CREATE SEQUENCE IF NOT EXISTS backups_historial_id_seq;
CREATE SEQUENCE IF NOT EXISTS blog_comentarios_id_comentario_seq;
CREATE SEQUENCE IF NOT EXISTS blog_etiquetas_id_blog_etiqueta_seq;
CREATE SEQUENCE IF NOT EXISTS blog_imagenes_id_blog_imagen_seq;
CREATE SEQUENCE IF NOT EXISTS blog_posts_etiquetas_id_seq;
CREATE SEQUENCE IF NOT EXISTS blog_posts_id_post_seq;
CREATE SEQUENCE IF NOT EXISTS blog_reacciones_id_reaccion_seq;
CREATE SEQUENCE IF NOT EXISTS carritos_id_carrito_seq;
CREATE SEQUENCE IF NOT EXISTS categorias_id_categoria_seq;
CREATE SEQUENCE IF NOT EXISTS certificados_autenticidad_id_certificado_seq;
CREATE SEQUENCE IF NOT EXISTS certificados_fotos_detalle_id_foto_seq;
CREATE SEQUENCE IF NOT EXISTS certificados_historial_id_historial_seq;
CREATE SEQUENCE IF NOT EXISTS codigos_2fa_email_id_codigo_seq;
CREATE SEQUENCE IF NOT EXISTS codigos_recuperacion_id_codigo_seq;
CREATE SEQUENCE IF NOT EXISTS codigos_vinculacion_id_seq;
CREATE SEQUENCE IF NOT EXISTS colecciones_id_coleccion_seq;
CREATE SEQUENCE IF NOT EXISTS comisiones_id_comision_seq;
CREATE SEQUENCE IF NOT EXISTS configuracion_sistema_id_configuracion_seq;
CREATE SEQUENCE IF NOT EXISTS conversaciones_venta_id_conversacion_seq;
CREATE SEQUENCE IF NOT EXISTS cupones_id_cupon_seq;
CREATE SEQUENCE IF NOT EXISTS cupones_usados_id_seq;
CREATE SEQUENCE IF NOT EXISTS direcciones_id_direccion_seq;
CREATE SEQUENCE IF NOT EXISTS estados_mexico_id_estado_seq;
CREATE SEQUENCE IF NOT EXISTS etiquetas_id_etiqueta_seq;
CREATE SEQUENCE IF NOT EXISTS favoritos_id_favorito_seq;
CREATE SEQUENCE IF NOT EXISTS historial_cambios_obras_id_cambio_seq;
CREATE SEQUENCE IF NOT EXISTS historial_login_id_historial_seq;
CREATE SEQUENCE IF NOT EXISTS imagenes_obras_id_imagen_seq;
CREATE SEQUENCE IF NOT EXISTS inventario_id_inventario_seq;
CREATE SEQUENCE IF NOT EXISTS liquidaciones_artistas_id_liquidacion_seq;
CREATE SEQUENCE IF NOT EXISTS materiales_id_material_seq;
CREATE SEQUENCE IF NOT EXISTS mensajes_adjuntos_id_adjunto_seq;
CREATE SEQUENCE IF NOT EXISTS mensajes_id_mensaje_seq;
CREATE SEQUENCE IF NOT EXISTS metodos_pago_id_metodo_pago_seq;
CREATE SEQUENCE IF NOT EXISTS monitoreo_historial_id_seq;
CREATE SEQUENCE IF NOT EXISTS municipios_id_municipio_seq;
CREATE SEQUENCE IF NOT EXISTS obras_etiquetas_id_seq;
CREATE SEQUENCE IF NOT EXISTS obras_id_obra_seq;
CREATE SEQUENCE IF NOT EXISTS obras_marcos_id_seq;
CREATE SEQUENCE IF NOT EXISTS "obras_tamaños_id_seq";
CREATE SEQUENCE IF NOT EXISTS palabras_prohibidas_id_palabra_seq;
CREATE SEQUENCE IF NOT EXISTS paqueterias_id_paqueteria_seq;
CREATE SEQUENCE IF NOT EXISTS pedidos_id_pedido_seq;
CREATE SEQUENCE IF NOT EXISTS preguntas_frecuentes_id_pregunta_seq;
CREATE SEQUENCE IF NOT EXISTS sesiones_activas_id_sesion_seq;
CREATE SEQUENCE IF NOT EXISTS sobre_nosotros_id_seq;
CREATE SEQUENCE IF NOT EXISTS "tamaños_disponibles_id_tamaño_seq";
CREATE SEQUENCE IF NOT EXISTS tecnicas_id_tecnica_seq;
CREATE SEQUENCE IF NOT EXISTS testimonios_id_testimonio_seq;
CREATE SEQUENCE IF NOT EXISTS tickets_soporte_id_ticket_seq;
CREATE SEQUENCE IF NOT EXISTS tipos_certificado_id_tipo_certificado_seq;
CREATE SEQUENCE IF NOT EXISTS tipos_marco_id_tipo_marco_seq;
CREATE SEQUENCE IF NOT EXISTS trayectoria_id_seq;
CREATE SEQUENCE IF NOT EXISTS usuarios_id_usuario_seq;
CREATE SEQUENCE IF NOT EXISTS ventas_id_venta_seq;
CREATE SEQUENCE IF NOT EXISTS vinculaciones_id_seq;

-- 4. Funciones
CREATE OR REPLACE FUNCTION public.actualizar_fecha_actualizacion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.fecha_actualizacion = CURRENT_TIMESTAMP; RETURN NEW; END; $function$
;

CREATE OR REPLACE FUNCTION public.calcular_comision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE porcentaje DECIMAL(5,2);
BEGIN
  SELECT porcentaje_comision INTO porcentaje FROM artistas WHERE id_artista = NEW.id_artista;
  NEW.porcentaje_comision := porcentaje;
  NEW.monto_comision := NEW.monto_venta * (porcentaje / 100);
  NEW.monto_neto_artista := NEW.monto_venta - NEW.monto_comision;
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.generar_matricula_artista()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.matricula := 'AR-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(NEW.id_artista::TEXT, 3, '0'); RETURN NEW; END; $function$
;

CREATE OR REPLACE FUNCTION public.generar_numero_serie_certificado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.numero_serie := 'CERT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(NEW.id_certificado::TEXT, 6, '0'); RETURN NEW; END; $function$
;

CREATE OR REPLACE FUNCTION public.sincronizar_inventario()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.stock_actual = 0 THEN UPDATE obras SET estado = 'agotada' WHERE id_obra = NEW.id_obra;
  ELSIF NEW.stock_actual > 0 AND (SELECT estado FROM obras WHERE id_obra = NEW.id_obra) = 'agotada' THEN
    UPDATE obras SET estado = 'publicada' WHERE id_obra = NEW.id_obra;
  END IF;
  NEW.ultima_actualizacion = CURRENT_TIMESTAMP; RETURN NEW;
END; $function$
;


-- 5. Tablas
CREATE TABLE artistas (
  id_artista integer NOT NULL DEFAULT nextval('artistas_id_artista_seq'::regclass),
  id_usuario integer,
  nombre_completo character varying(200) NOT NULL,
  nombre_artistico character varying(200),
  biografia text,
  foto_perfil character varying(255),
  correo character varying(255),
  telefono character varying(20),
  id_categoria_principal integer,
  porcentaje_comision numeric(5,2) DEFAULT 15.00,
  estado character varying(50) DEFAULT 'pendiente'::character varying,
  fecha_aprobacion timestamp without time zone,
  aprobado_por integer,
  matricula character varying(50),
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  eliminado_por integer,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  acepta_envios boolean DEFAULT true,
  solo_entrega_personal boolean DEFAULT false,
  direccion_taller text,
  ciudad character varying(100),
  id_estado_base integer,
  codigo_postal character varying(10),
  dias_preparacion_default integer DEFAULT 3,
  politica_envios text,
  politica_devoluciones text,
  foto_portada character varying(255),
  foto_logo character varying(255),
  clabe character varying(18),
  banco character varying(100)
);

CREATE TABLE artistas_datos_bancarios (
  id_datos_bancarios integer NOT NULL DEFAULT nextval('artistas_datos_bancarios_id_datos_bancarios_seq'::regclass),
  id_artista integer NOT NULL,
  banco character varying(100) NOT NULL,
  clabe character varying(18),
  numero_cuenta character varying(20),
  titular character varying(200) NOT NULL,
  rfc character varying(13),
  verificado boolean DEFAULT false,
  verificado_por integer,
  fecha_verificacion timestamp without time zone,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artistas_fotos_personales (
  id_foto integer NOT NULL DEFAULT nextval('artistas_fotos_personales_id_foto_seq'::regclass),
  id_artista integer NOT NULL,
  url_foto character varying(500) NOT NULL,
  es_principal boolean DEFAULT false,
  orden integer DEFAULT 0,
  activa boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artistas_metodos_envio (
  id_metodo_envio integer NOT NULL DEFAULT nextval('artistas_metodos_envio_id_metodo_envio_seq'::regclass),
  id_artista integer NOT NULL,
  nombre character varying(100) NOT NULL,
  descripcion text,
  costo_base numeric(10,2) NOT NULL,
  costo_adicional_kg numeric(10,2) DEFAULT 0,
  peso_base_kg numeric(5,2) DEFAULT 1,
  cobertura character varying(50) DEFAULT 'nacional'::character varying,
  estados_disponibles jsonb,
  dias_preparacion integer DEFAULT 2,
  dias_entrega_min integer,
  dias_entrega_max integer,
  usa_paqueteria_propia boolean DEFAULT false,
  nombre_paqueteria_propia character varying(100),
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artistas_portafolio (
  id_portafolio integer NOT NULL DEFAULT nextval('artistas_portafolio_id_portafolio_seq'::regclass),
  id_artista integer NOT NULL,
  titulo character varying(255),
  descripcion text,
  url_imagen character varying(500) NOT NULL,
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artistas_redes_sociales (
  id_red integer NOT NULL DEFAULT nextval('artistas_redes_sociales_id_red_seq'::regclass),
  id_artista integer NOT NULL,
  red_social tipo_red_social NOT NULL,
  url character varying(500) NOT NULL,
  usuario character varying(100),
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artistas_zonas_envio (
  id_zona integer NOT NULL DEFAULT nextval('artistas_zonas_envio_id_zona_seq'::regclass),
  id_artista integer NOT NULL,
  tipo_zona character varying(50) NOT NULL,
  id_estado integer,
  id_municipio integer,
  nombre_zona character varying(150),
  costo_envio numeric(10,2) NOT NULL,
  envio_gratis_desde numeric(10,2),
  dias_entrega_estimados integer,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backup_config_cron (
  id integer NOT NULL DEFAULT nextval('backup_config_cron_id_seq'::regclass),
  activo boolean DEFAULT false,
  frecuencia character varying(20) DEFAULT 'diario'::character varying,
  hora integer DEFAULT 2,
  dia_semana integer DEFAULT 1,
  ultimo_cron timestamp with time zone,
  proximo_cron timestamp with time zone,
  id_admin integer,
  actualizado_en timestamp with time zone DEFAULT now(),
  tablas jsonb
);

CREATE TABLE backups_historial (
  id integer NOT NULL DEFAULT nextval('backups_historial_id_seq'::regclass),
  id_admin integer,
  fecha timestamp with time zone DEFAULT now(),
  tablas integer,
  filas_total integer,
  tamanio_bytes bigint,
  duracion_ms integer,
  checksum_md5 character varying(32),
  nombre_archivo character varying(200),
  url_archivo text
);

CREATE TABLE blog_comentarios (
  id_comentario integer NOT NULL DEFAULT nextval('blog_comentarios_id_comentario_seq'::regclass),
  id_post integer NOT NULL,
  id_usuario integer NOT NULL,
  padre_id integer,
  nivel smallint NOT NULL DEFAULT 0,
  contenido text NOT NULL,
  imagen_url character varying(500),
  estado character varying(20) DEFAULT 'pendiente'::character varying,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  eliminado boolean DEFAULT false,
  eliminado_por integer,
  fecha_eliminacion timestamp without time zone
);

CREATE TABLE blog_etiquetas (
  id_blog_etiqueta integer NOT NULL DEFAULT nextval('blog_etiquetas_id_blog_etiqueta_seq'::regclass),
  nombre character varying(100) NOT NULL,
  slug character varying(100) NOT NULL,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_imagenes (
  id_blog_imagen integer NOT NULL DEFAULT nextval('blog_imagenes_id_blog_imagen_seq'::regclass),
  id_post integer NOT NULL,
  url_imagen character varying(500) NOT NULL,
  descripcion character varying(255),
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_posts (
  id_post integer NOT NULL DEFAULT nextval('blog_posts_id_post_seq'::regclass),
  id_categoria integer,
  titulo character varying(255) NOT NULL,
  slug character varying(255) NOT NULL,
  contenido text NOT NULL,
  extracto text,
  imagen_destacada character varying(500),
  meta_description character varying(160),
  estado character varying(50) DEFAULT 'borrador'::character varying,
  fecha_publicacion timestamp without time zone,
  vistas integer DEFAULT 0,
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  eliminado_por integer,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  autor_id integer NOT NULL,
  autor_rol character varying(20) NOT NULL
);

CREATE TABLE blog_posts_etiquetas (
  id integer NOT NULL DEFAULT nextval('blog_posts_etiquetas_id_seq'::regclass),
  id_post integer NOT NULL,
  id_blog_etiqueta integer NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_posts_relacionados (
  id_post integer NOT NULL,
  id_post_relacionado integer NOT NULL,
  score numeric(6,4) NOT NULL
);

CREATE TABLE blog_reacciones (
  id_reaccion integer NOT NULL DEFAULT nextval('blog_reacciones_id_reaccion_seq'::regclass),
  id_post integer NOT NULL,
  id_usuario integer NOT NULL,
  emoji character varying(16) NOT NULL,
  fecha_creacion timestamp with time zone NOT NULL DEFAULT now(),
  fecha_actualizacion timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE carritos (
  id_carrito integer NOT NULL DEFAULT nextval('carritos_id_carrito_seq'::regclass),
  id_usuario integer NOT NULL,
  id_obra integer NOT NULL,
  "id_obra_tamaño" integer,
  id_tipo_marco integer,
  cantidad integer DEFAULT 1,
  con_marco boolean DEFAULT false,
  activo boolean DEFAULT true,
  fecha_agregado timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias (
  id_categoria integer NOT NULL DEFAULT nextval('categorias_id_categoria_seq'::regclass),
  nombre character varying(100) NOT NULL,
  descripcion text,
  slug character varying(100) NOT NULL,
  icono character varying(255),
  activa boolean DEFAULT true,
  eliminada boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias_materiales (
  id_categoria integer NOT NULL,
  id_material integer NOT NULL
);

CREATE TABLE certificados_autenticidad (
  id_certificado integer NOT NULL DEFAULT nextval('certificados_autenticidad_id_certificado_seq'::regclass),
  id_obra integer NOT NULL,
  id_artista integer NOT NULL,
  id_tipo_certificado integer NOT NULL,
  numero_serie character varying(100) NOT NULL,
  archivo_certificado character varying(500),
  codigo_qr character varying(500),
  firma_digital character varying(500),
  tecnica_materiales text,
  descripcion_autenticidad text,
  fecha_creacion_obra date,
  verificado boolean DEFAULT false,
  verificado_por integer,
  fecha_certificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_verificacion timestamp without time zone,
  activo boolean DEFAULT true,
  revocado boolean DEFAULT false,
  fecha_revocacion timestamp without time zone,
  motivo_revocacion text,
  revocado_por integer,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificados_fotos_detalle (
  id_foto integer NOT NULL DEFAULT nextval('certificados_fotos_detalle_id_foto_seq'::regclass),
  id_certificado integer NOT NULL,
  url_imagen character varying(500) NOT NULL,
  descripcion character varying(255),
  orden integer DEFAULT 0,
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificados_historial (
  id_historial integer NOT NULL DEFAULT nextval('certificados_historial_id_historial_seq'::regclass),
  id_certificado integer NOT NULL,
  id_usuario integer NOT NULL,
  accion character varying(50) NOT NULL,
  descripcion_cambio text,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE codigos_2fa_email (
  id_codigo integer NOT NULL DEFAULT nextval('codigos_2fa_email_id_codigo_seq'::regclass),
  id_usuario integer NOT NULL,
  codigo character varying(10) NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion timestamp without time zone NOT NULL,
  usado boolean DEFAULT false,
  ip_solicitud character varying(45)
);

CREATE TABLE codigos_recuperacion (
  id_codigo integer NOT NULL DEFAULT nextval('codigos_recuperacion_id_codigo_seq'::regclass),
  id_usuario integer NOT NULL,
  codigo character varying(10) NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion timestamp without time zone NOT NULL,
  usado boolean DEFAULT false,
  ip_solicitud character varying(45)
);

CREATE TABLE codigos_vinculacion (
  id integer NOT NULL DEFAULT nextval('codigos_vinculacion_id_seq'::regclass),
  usuario_id integer NOT NULL,
  codigo character varying(4) NOT NULL,
  usado boolean DEFAULT false,
  expira_en timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE colecciones (
  id_coleccion integer NOT NULL DEFAULT nextval('colecciones_id_coleccion_seq'::regclass),
  id_artista integer NOT NULL,
  nombre character varying(200) NOT NULL,
  slug character varying(200) NOT NULL,
  historia text,
  imagen_portada character varying(500),
  estado character varying(50) DEFAULT 'borrador'::character varying,
  destacada boolean DEFAULT false,
  activa boolean DEFAULT true,
  eliminada boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_publicacion_programada timestamp with time zone
);

CREATE TABLE comisiones (
  id_comision integer NOT NULL DEFAULT nextval('comisiones_id_comision_seq'::regclass),
  id_artista integer NOT NULL,
  id_venta integer NOT NULL,
  monto_venta numeric(10,2) NOT NULL,
  porcentaje_comision numeric(5,2) NOT NULL,
  monto_comision numeric(10,2) NOT NULL,
  monto_neto_artista numeric(10,2) NOT NULL,
  estado estado_comision DEFAULT 'pendiente'::estado_comision,
  fecha_calculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_pago timestamp without time zone,
  metodo_pago character varying(100),
  comprobante_pago character varying(500),
  cancelado boolean DEFAULT false,
  fecha_cancelacion timestamp without time zone,
  motivo_cancelacion text,
  monto_comision_plataforma numeric(10,2),
  fecha_pago_artista timestamp without time zone,
  metodo_pago_artista character varying(100),
  referencia_transferencia character varying(255)
);

CREATE TABLE configuracion_sistema (
  id_configuracion integer NOT NULL DEFAULT nextval('configuracion_sistema_id_configuracion_seq'::regclass),
  clave character varying(100) NOT NULL,
  valor text,
  tipo character varying(50) NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversaciones_venta (
  id_conversacion integer NOT NULL DEFAULT nextval('conversaciones_venta_id_conversacion_seq'::regclass),
  id_venta integer NOT NULL,
  id_remitente integer NOT NULL,
  tipo_remitente character varying(20) NOT NULL,
  mensaje text NOT NULL,
  adjuntos jsonb,
  leido boolean DEFAULT false,
  fecha_lectura timestamp without time zone,
  fecha_mensaje timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cupones (
  id_cupon integer NOT NULL DEFAULT nextval('cupones_id_cupon_seq'::regclass),
  codigo character varying(50) NOT NULL,
  descripcion text,
  tipo character varying(20) NOT NULL DEFAULT 'porcentaje'::character varying,
  valor numeric(10,2) NOT NULL,
  monto_minimo numeric(10,2) NOT NULL DEFAULT 0,
  usos_max integer,
  usos_actuales integer NOT NULL DEFAULT 0,
  fecha_fin timestamp with time zone,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE cupones_usados (
  id integer NOT NULL DEFAULT nextval('cupones_usados_id_seq'::regclass),
  id_cupon integer NOT NULL,
  id_usuario integer NOT NULL,
  id_pedido integer,
  descuento_aplicado numeric(10,2),
  usado_en timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE direcciones (
  id_direccion integer NOT NULL DEFAULT nextval('direcciones_id_direccion_seq'::regclass),
  id_usuario integer NOT NULL,
  tipo character varying(20) DEFAULT 'envio'::character varying,
  alias character varying(100),
  calle character varying(255) NOT NULL,
  numero_exterior character varying(20) NOT NULL,
  numero_interior character varying(20),
  colonia character varying(150) NOT NULL,
  id_municipio integer NOT NULL,
  id_estado integer NOT NULL,
  codigo_postal character varying(10) NOT NULL,
  referencias text,
  es_principal boolean DEFAULT false,
  activa boolean DEFAULT true,
  eliminada boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estados_mexico (
  id_estado integer NOT NULL DEFAULT nextval('estados_mexico_id_estado_seq'::regclass),
  nombre character varying(100) NOT NULL,
  codigo character varying(5) NOT NULL,
  abreviatura character varying(10),
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE etiquetas (
  id_etiqueta integer NOT NULL DEFAULT nextval('etiquetas_id_etiqueta_seq'::regclass),
  nombre character varying(100) NOT NULL,
  slug character varying(100) NOT NULL,
  activa boolean DEFAULT true,
  eliminada boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favoritos (
  id_favorito integer NOT NULL DEFAULT nextval('favoritos_id_favorito_seq'::regclass),
  id_usuario integer NOT NULL,
  id_obra integer NOT NULL,
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_agregado timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_cambios_obras (
  id_cambio integer NOT NULL DEFAULT nextval('historial_cambios_obras_id_cambio_seq'::regclass),
  id_obra integer NOT NULL,
  id_usuario integer NOT NULL,
  campo_modificado character varying(100) NOT NULL,
  valor_anterior text,
  valor_nuevo text,
  fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_login (
  id_historial integer NOT NULL DEFAULT nextval('historial_login_id_historial_seq'::regclass),
  id_usuario integer,
  correo character varying(255) NOT NULL,
  tipo_evento tipo_evento_login NOT NULL,
  ip_address character varying(45),
  user_agent text,
  fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  detalles text
);

CREATE TABLE imagenes_obras (
  id_imagen integer NOT NULL DEFAULT nextval('imagenes_obras_id_imagen_seq'::regclass),
  id_obra integer NOT NULL,
  url_imagen character varying(255) NOT NULL,
  descripcion character varying(255),
  orden integer DEFAULT 0,
  es_principal boolean DEFAULT false,
  es_detalle boolean DEFAULT false,
  activa boolean DEFAULT true,
  eliminada boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_subida timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventario (
  id_inventario integer NOT NULL DEFAULT nextval('inventario_id_inventario_seq'::regclass),
  id_obra integer,
  stock_actual integer DEFAULT 0,
  stock_reservado integer DEFAULT 0,
  stock_vendido integer DEFAULT 0,
  activo boolean DEFAULT true,
  ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE liquidaciones_artistas (
  id_liquidacion integer NOT NULL DEFAULT nextval('liquidaciones_artistas_id_liquidacion_seq'::regclass),
  id_artista integer NOT NULL,
  id_admin integer NOT NULL,
  monto_total numeric(10,2) NOT NULL,
  fecha_liquidacion timestamp with time zone DEFAULT now(),
  notas text,
  comprobante_url text
);

CREATE TABLE materiales (
  id_material integer NOT NULL DEFAULT nextval('materiales_id_material_seq'::regclass),
  nombre character varying(100) NOT NULL,
  activa boolean NOT NULL DEFAULT true
);

CREATE TABLE mensajes (
  id_mensaje integer NOT NULL DEFAULT nextval('mensajes_id_mensaje_seq'::regclass),
  id_remitente integer NOT NULL,
  id_destinatario integer NOT NULL,
  asunto character varying(255) NOT NULL,
  contenido text NOT NULL,
  prioridad prioridad_mensaje DEFAULT 'normal'::prioridad_mensaje,
  leido boolean DEFAULT false,
  fecha_lectura timestamp without time zone,
  archivado boolean DEFAULT false,
  importante boolean DEFAULT false,
  hilo_id integer,
  eliminado_remitente boolean DEFAULT false,
  eliminado_destinatario boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mensajes_adjuntos (
  id_adjunto integer NOT NULL DEFAULT nextval('mensajes_adjuntos_id_adjunto_seq'::regclass),
  id_mensaje integer NOT NULL,
  nombre_archivo character varying(255) NOT NULL,
  url_archivo character varying(500) NOT NULL,
  tipo_archivo character varying(100) NOT NULL,
  tamano_bytes integer NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE metodos_pago (
  id_metodo_pago integer NOT NULL DEFAULT nextval('metodos_pago_id_metodo_pago_seq'::regclass),
  nombre character varying(100) NOT NULL,
  codigo character varying(50) NOT NULL,
  proveedor character varying(100),
  descripcion text,
  comision_porcentaje numeric(5,2) DEFAULT 0,
  icono character varying(500),
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE monitoreo_historial (
  id integer NOT NULL DEFAULT nextval('monitoreo_historial_id_seq'::regclass),
  tipo character varying(20) NOT NULL,
  tabla character varying(200),
  alcance character varying(20) DEFAULT 'individual'::character varying,
  duracion_ms integer,
  exitoso boolean DEFAULT true,
  error_msg text,
  id_admin integer,
  ejecutado_en timestamp with time zone DEFAULT now()
);

CREATE TABLE municipios (
  id_municipio integer NOT NULL DEFAULT nextval('municipios_id_municipio_seq'::regclass),
  id_estado integer NOT NULL,
  nombre character varying(150) NOT NULL,
  codigo_postal_rango character varying(50),
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE obras (
  id_obra integer NOT NULL DEFAULT nextval('obras_id_obra_seq'::regclass),
  id_artista integer NOT NULL,
  id_categoria integer NOT NULL,
  id_tecnica integer,
  id_usuario_creacion integer NOT NULL,
  id_usuario_actualizacion integer,
  titulo character varying(255) NOT NULL,
  descripcion text,
  slug character varying(255) NOT NULL,
  anio_creacion integer,
  dimensiones_alto numeric(8,2),
  dimensiones_ancho numeric(8,2),
  dimensiones_profundidad numeric(8,2),
  dimensiones_unidad character varying(10) DEFAULT 'cm'::character varying,
  imagen_principal character varying(255),
  precio_base numeric(10,2),
  permite_marco boolean DEFAULT true,
  con_certificado boolean DEFAULT false,
  estado character varying(50) DEFAULT 'pendiente'::character varying,
  fecha_aprobacion timestamp without time zone,
  aprobado_por integer,
  motivo_rechazo text,
  activa boolean DEFAULT true,
  visible boolean DEFAULT true,
  destacada boolean DEFAULT false,
  eliminada boolean DEFAULT false,
  fecha_desactivacion timestamp without time zone,
  fecha_eliminacion timestamp without time zone,
  motivo_desactivacion text,
  eliminado_por integer,
  vistas integer DEFAULT 0,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  historia text,
  id_coleccion integer,
  fecha_publicacion_programada timestamp with time zone,
  "tiene_tamaños" boolean DEFAULT false,
  precio_descuento numeric(10,2),
  descuento_expira timestamp with time zone,
  disponible_envio boolean NOT NULL DEFAULT false,
  id_material integer,
  es_original boolean NOT NULL DEFAULT true,
  numero_edicion integer,
  peso_kg numeric(6,2)
);

CREATE TABLE obras_etiquetas (
  id integer NOT NULL DEFAULT nextval('obras_etiquetas_id_seq'::regclass),
  id_obra integer NOT NULL,
  id_etiqueta integer NOT NULL,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE obras_marcos (
  id integer NOT NULL DEFAULT nextval('obras_marcos_id_seq'::regclass),
  "id_obra_tamaño" integer NOT NULL,
  id_tipo_marco integer NOT NULL,
  precio_total numeric(10,2) NOT NULL,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "obras_tamaños" (
  id integer NOT NULL DEFAULT nextval('"obras_tamaños_id_seq"'::regclass),
  id_obra integer NOT NULL,
  "id_tamaño" integer NOT NULL,
  precio_base numeric(10,2) NOT NULL,
  cantidad_disponible integer DEFAULT 0,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE palabras_prohibidas (
  id_palabra integer NOT NULL DEFAULT nextval('palabras_prohibidas_id_palabra_seq'::regclass),
  palabra character varying(100) NOT NULL,
  activa boolean DEFAULT true,
  creado_por integer,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE paqueterias (
  id_paqueteria integer NOT NULL DEFAULT nextval('paqueterias_id_paqueteria_seq'::regclass),
  nombre character varying(100) NOT NULL,
  codigo character varying(50) NOT NULL,
  url_rastreo character varying(500),
  telefono character varying(20),
  email character varying(255),
  logo character varying(500),
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
  id_pedido integer NOT NULL DEFAULT nextval('pedidos_id_pedido_seq'::regclass),
  id_cliente integer,
  id_direccion_envio integer,
  estado character varying(20) DEFAULT 'pendiente'::character varying,
  total numeric(10,2),
  fecha_pedido timestamp with time zone DEFAULT now(),
  empaque_reforzado boolean DEFAULT false,
  precio_empaque numeric(10,2) DEFAULT 0,
  id_cupon integer,
  descuento_cupon numeric(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE preguntas_frecuentes (
  id_pregunta integer NOT NULL DEFAULT nextval('preguntas_frecuentes_id_pregunta_seq'::regclass),
  categoria character varying(100) NOT NULL,
  pregunta text NOT NULL,
  respuesta text NOT NULL,
  orden integer DEFAULT 0,
  activa boolean DEFAULT true,
  eliminada boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesiones_activas (
  id_sesion integer NOT NULL DEFAULT nextval('sesiones_activas_id_sesion_seq'::regclass),
  id_usuario integer NOT NULL,
  token character varying(500) NOT NULL,
  token_hash character varying(64),
  ip_address character varying(45),
  user_agent text,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion timestamp without time zone NOT NULL,
  activa boolean DEFAULT true
);

CREATE TABLE sobre_nosotros (
  id integer NOT NULL DEFAULT nextval('sobre_nosotros_id_seq'::regclass),
  mision text,
  vision text,
  historia text,
  "año_fundacion" integer,
  logros text,
  valores text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  descripcion_region text
);

CREATE TABLE "tamaños_disponibles" (
  "id_tamaño" integer NOT NULL DEFAULT nextval('"tamaños_disponibles_id_tamaño_seq"'::regclass),
  nombre character varying(100) NOT NULL,
  ancho_cm numeric(8,2) NOT NULL,
  alto_cm numeric(8,2) NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tecnicas (
  id_tecnica integer NOT NULL DEFAULT nextval('tecnicas_id_tecnica_seq'::regclass),
  id_categoria integer,
  nombre character varying(150) NOT NULL,
  descripcion text,
  activa boolean DEFAULT true,
  eliminada boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonios (
  id_testimonio integer NOT NULL DEFAULT nextval('testimonios_id_testimonio_seq'::regclass),
  id_usuario integer NOT NULL,
  calificacion integer NOT NULL,
  comentario text NOT NULL,
  visible boolean DEFAULT false,
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tickets_soporte (
  id_ticket integer NOT NULL DEFAULT nextval('tickets_soporte_id_ticket_seq'::regclass),
  id_usuario integer NOT NULL,
  asunto character varying(255) NOT NULL,
  descripcion text NOT NULL,
  categoria categoria_ticket NOT NULL,
  prioridad prioridad_ticket DEFAULT 'media'::prioridad_ticket,
  estado estado_ticket DEFAULT 'abierto'::estado_ticket,
  id_asignado_a integer,
  respuesta text,
  fecha_resolucion timestamp without time zone,
  activo boolean DEFAULT true,
  archivado boolean DEFAULT false,
  fecha_archivado timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_certificado (
  id_tipo_certificado integer NOT NULL DEFAULT nextval('tipos_certificado_id_tipo_certificado_seq'::regclass),
  nombre character varying(100) NOT NULL,
  codigo character varying(20) NOT NULL,
  descripcion text,
  plantilla_certificado character varying(500),
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tipos_marco (
  id_tipo_marco integer NOT NULL DEFAULT nextval('tipos_marco_id_tipo_marco_seq'::regclass),
  nombre character varying(100) NOT NULL,
  descripcion text,
  material character varying(100),
  color character varying(50),
  precio_adicional numeric(10,2) NOT NULL,
  imagen character varying(255),
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ancho_cm numeric(6,1),
  alto_cm numeric(6,1)
);

CREATE TABLE trayectoria (
  id integer NOT NULL DEFAULT nextval('trayectoria_id_seq'::regclass),
  sobre_nosotros_id integer,
  "año" character varying(10),
  titulo character varying(100),
  descripcion text
);

CREATE TABLE usuarios (
  id_usuario integer NOT NULL DEFAULT nextval('usuarios_id_usuario_seq'::regclass),
  correo character varying(255) NOT NULL,
  "contraseña_hash" character varying(255),
  nombre_completo character varying(200),
  telefono character varying(20),
  rol character varying(50) DEFAULT 'cliente'::character varying,
  estado character varying(50) DEFAULT 'activo'::character varying,
  verificado boolean DEFAULT false,
  token_verificacion character varying(255),
  token_recuperacion character varying(255),
  token_expiracion timestamp without time zone,
  intentos_fallidos integer DEFAULT 0,
  bloqueado_hasta timestamp without time zone,
  bloqueado_recuperacion_hasta timestamp without time zone,
  requiere_2fa boolean DEFAULT false,
  secret_2fa character varying(255),
  metodo_2fa character varying(10) DEFAULT 'NINGUNO'::character varying,
  activo boolean DEFAULT true,
  eliminado boolean DEFAULT false,
  fecha_eliminacion timestamp without time zone,
  eliminado_por integer,
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ultima_conexion timestamp without time zone,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ventas (
  id_venta integer NOT NULL DEFAULT nextval('ventas_id_venta_seq'::regclass),
  id_cliente integer NOT NULL,
  id_obra integer NOT NULL,
  id_artista integer NOT NULL,
  cantidad integer DEFAULT 1,
  precio_unitario numeric(10,2) NOT NULL,
  con_marco boolean DEFAULT false,
  id_tipo_marco integer,
  precio_marco numeric(10,2) DEFAULT 0,
  subtotal numeric(10,2) NOT NULL,
  iva numeric(10,2) DEFAULT 0,
  costo_envio numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  id_metodo_pago integer,
  stripe_payment_id character varying(255),
  stripe_charge_id character varying(255),
  estado estado_venta DEFAULT 'pendiente'::estado_venta,
  id_direccion_envio integer,
  numero_guia character varying(100),
  id_paqueteria integer,
  fecha_estimada_entrega date,
  cancelado boolean DEFAULT false,
  fecha_cancelacion timestamp without time zone,
  motivo_cancelacion text,
  cancelado_por integer,
  fecha_venta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_pago timestamp without time zone,
  fecha_envio timestamp without time zone,
  fecha_entrega timestamp without time zone,
  "id_obra_tamaño" integer,
  comision_plataforma numeric(10,2),
  total_cliente numeric(10,2),
  total_artista numeric(10,2),
  estado_pago character varying(50) DEFAULT 'pendiente'::character varying,
  estado_envio character varying(50) DEFAULT 'pendiente'::character varying,
  id_metodo_envio_artista integer,
  metodo_envio character varying(100),
  notas_envio text,
  id_pedido integer,
  id_obra_tamano integer,
  label_tamano character varying(80),
  label_marco character varying(120),
  monto_artista numeric(10,2),
  id_liquidacion integer
);

CREATE TABLE vinculaciones (
  id integer NOT NULL DEFAULT nextval('vinculaciones_id_seq'::regclass),
  alexa_user_id character varying(255) NOT NULL,
  usuario_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT now()
);


-- 6. Secuencias ligadas a columnas
ALTER SEQUENCE artistas_datos_bancarios_id_datos_bancarios_seq OWNED BY artistas_datos_bancarios.id_datos_bancarios;
ALTER SEQUENCE artistas_fotos_personales_id_foto_seq OWNED BY artistas_fotos_personales.id_foto;
ALTER SEQUENCE artistas_id_artista_seq OWNED BY artistas.id_artista;
ALTER SEQUENCE artistas_metodos_envio_id_metodo_envio_seq OWNED BY artistas_metodos_envio.id_metodo_envio;
ALTER SEQUENCE artistas_portafolio_id_portafolio_seq OWNED BY artistas_portafolio.id_portafolio;
ALTER SEQUENCE artistas_redes_sociales_id_red_seq OWNED BY artistas_redes_sociales.id_red;
ALTER SEQUENCE artistas_zonas_envio_id_zona_seq OWNED BY artistas_zonas_envio.id_zona;
ALTER SEQUENCE backup_config_cron_id_seq OWNED BY backup_config_cron.id;
ALTER SEQUENCE backups_historial_id_seq OWNED BY backups_historial.id;
ALTER SEQUENCE blog_comentarios_id_comentario_seq OWNED BY blog_comentarios.id_comentario;
ALTER SEQUENCE blog_etiquetas_id_blog_etiqueta_seq OWNED BY blog_etiquetas.id_blog_etiqueta;
ALTER SEQUENCE blog_imagenes_id_blog_imagen_seq OWNED BY blog_imagenes.id_blog_imagen;
ALTER SEQUENCE blog_posts_etiquetas_id_seq OWNED BY blog_posts_etiquetas.id;
ALTER SEQUENCE blog_posts_id_post_seq OWNED BY blog_posts.id_post;
ALTER SEQUENCE blog_reacciones_id_reaccion_seq OWNED BY blog_reacciones.id_reaccion;
ALTER SEQUENCE carritos_id_carrito_seq OWNED BY carritos.id_carrito;
ALTER SEQUENCE categorias_id_categoria_seq OWNED BY categorias.id_categoria;
ALTER SEQUENCE certificados_autenticidad_id_certificado_seq OWNED BY certificados_autenticidad.id_certificado;
ALTER SEQUENCE certificados_fotos_detalle_id_foto_seq OWNED BY certificados_fotos_detalle.id_foto;
ALTER SEQUENCE certificados_historial_id_historial_seq OWNED BY certificados_historial.id_historial;
ALTER SEQUENCE codigos_2fa_email_id_codigo_seq OWNED BY codigos_2fa_email.id_codigo;
ALTER SEQUENCE codigos_recuperacion_id_codigo_seq OWNED BY codigos_recuperacion.id_codigo;
ALTER SEQUENCE codigos_vinculacion_id_seq OWNED BY codigos_vinculacion.id;
ALTER SEQUENCE colecciones_id_coleccion_seq OWNED BY colecciones.id_coleccion;
ALTER SEQUENCE comisiones_id_comision_seq OWNED BY comisiones.id_comision;
ALTER SEQUENCE configuracion_sistema_id_configuracion_seq OWNED BY configuracion_sistema.id_configuracion;
ALTER SEQUENCE conversaciones_venta_id_conversacion_seq OWNED BY conversaciones_venta.id_conversacion;
ALTER SEQUENCE cupones_id_cupon_seq OWNED BY cupones.id_cupon;
ALTER SEQUENCE cupones_usados_id_seq OWNED BY cupones_usados.id;
ALTER SEQUENCE direcciones_id_direccion_seq OWNED BY direcciones.id_direccion;
ALTER SEQUENCE estados_mexico_id_estado_seq OWNED BY estados_mexico.id_estado;
ALTER SEQUENCE etiquetas_id_etiqueta_seq OWNED BY etiquetas.id_etiqueta;
ALTER SEQUENCE favoritos_id_favorito_seq OWNED BY favoritos.id_favorito;
ALTER SEQUENCE historial_cambios_obras_id_cambio_seq OWNED BY historial_cambios_obras.id_cambio;
ALTER SEQUENCE historial_login_id_historial_seq OWNED BY historial_login.id_historial;
ALTER SEQUENCE imagenes_obras_id_imagen_seq OWNED BY imagenes_obras.id_imagen;
ALTER SEQUENCE inventario_id_inventario_seq OWNED BY inventario.id_inventario;
ALTER SEQUENCE liquidaciones_artistas_id_liquidacion_seq OWNED BY liquidaciones_artistas.id_liquidacion;
ALTER SEQUENCE materiales_id_material_seq OWNED BY materiales.id_material;
ALTER SEQUENCE mensajes_adjuntos_id_adjunto_seq OWNED BY mensajes_adjuntos.id_adjunto;
ALTER SEQUENCE mensajes_id_mensaje_seq OWNED BY mensajes.id_mensaje;
ALTER SEQUENCE metodos_pago_id_metodo_pago_seq OWNED BY metodos_pago.id_metodo_pago;
ALTER SEQUENCE monitoreo_historial_id_seq OWNED BY monitoreo_historial.id;
ALTER SEQUENCE municipios_id_municipio_seq OWNED BY municipios.id_municipio;
ALTER SEQUENCE obras_etiquetas_id_seq OWNED BY obras_etiquetas.id;
ALTER SEQUENCE obras_id_obra_seq OWNED BY obras.id_obra;
ALTER SEQUENCE obras_marcos_id_seq OWNED BY obras_marcos.id;
ALTER SEQUENCE "obras_tamaños_id_seq" OWNED BY "obras_tamaños".id;
ALTER SEQUENCE palabras_prohibidas_id_palabra_seq OWNED BY palabras_prohibidas.id_palabra;
ALTER SEQUENCE paqueterias_id_paqueteria_seq OWNED BY paqueterias.id_paqueteria;
ALTER SEQUENCE pedidos_id_pedido_seq OWNED BY pedidos.id_pedido;
ALTER SEQUENCE preguntas_frecuentes_id_pregunta_seq OWNED BY preguntas_frecuentes.id_pregunta;
ALTER SEQUENCE sesiones_activas_id_sesion_seq OWNED BY sesiones_activas.id_sesion;
ALTER SEQUENCE sobre_nosotros_id_seq OWNED BY sobre_nosotros.id;
ALTER SEQUENCE "tamaños_disponibles_id_tamaño_seq" OWNED BY "tamaños_disponibles"."id_tamaño";
ALTER SEQUENCE tecnicas_id_tecnica_seq OWNED BY tecnicas.id_tecnica;
ALTER SEQUENCE testimonios_id_testimonio_seq OWNED BY testimonios.id_testimonio;
ALTER SEQUENCE tickets_soporte_id_ticket_seq OWNED BY tickets_soporte.id_ticket;
ALTER SEQUENCE tipos_certificado_id_tipo_certificado_seq OWNED BY tipos_certificado.id_tipo_certificado;
ALTER SEQUENCE tipos_marco_id_tipo_marco_seq OWNED BY tipos_marco.id_tipo_marco;
ALTER SEQUENCE trayectoria_id_seq OWNED BY trayectoria.id;
ALTER SEQUENCE usuarios_id_usuario_seq OWNED BY usuarios.id_usuario;
ALTER SEQUENCE ventas_id_venta_seq OWNED BY ventas.id_venta;
ALTER SEQUENCE vinculaciones_id_seq OWNED BY vinculaciones.id;

-- 7. Llaves primarias, únicas y checks
ALTER TABLE artistas ADD CONSTRAINT artistas_id_usuario_key UNIQUE (id_usuario);
ALTER TABLE artistas ADD CONSTRAINT artistas_matricula_key UNIQUE (matricula);
ALTER TABLE artistas ADD CONSTRAINT artistas_pkey PRIMARY KEY (id_artista);
ALTER TABLE artistas ADD CONSTRAINT artistas_porcentaje_comision_check CHECK (((porcentaje_comision >= (0)::numeric) AND (porcentaje_comision <= (100)::numeric)));
ALTER TABLE artistas_datos_bancarios ADD CONSTRAINT artistas_datos_bancarios_id_artista_key UNIQUE (id_artista);
ALTER TABLE artistas_datos_bancarios ADD CONSTRAINT artistas_datos_bancarios_pkey PRIMARY KEY (id_datos_bancarios);
ALTER TABLE artistas_fotos_personales ADD CONSTRAINT artistas_fotos_personales_pkey PRIMARY KEY (id_foto);
ALTER TABLE artistas_metodos_envio ADD CONSTRAINT artistas_metodos_envio_costo_base_check CHECK ((costo_base >= (0)::numeric));
ALTER TABLE artistas_metodos_envio ADD CONSTRAINT artistas_metodos_envio_pkey PRIMARY KEY (id_metodo_envio);
ALTER TABLE artistas_portafolio ADD CONSTRAINT artistas_portafolio_pkey PRIMARY KEY (id_portafolio);
ALTER TABLE artistas_redes_sociales ADD CONSTRAINT artistas_redes_sociales_id_artista_red_social_key UNIQUE (id_artista, red_social);
ALTER TABLE artistas_redes_sociales ADD CONSTRAINT artistas_redes_sociales_pkey PRIMARY KEY (id_red);
ALTER TABLE artistas_zonas_envio ADD CONSTRAINT artistas_zonas_envio_costo_envio_check CHECK ((costo_envio >= (0)::numeric));
ALTER TABLE artistas_zonas_envio ADD CONSTRAINT artistas_zonas_envio_pkey PRIMARY KEY (id_zona);
ALTER TABLE backup_config_cron ADD CONSTRAINT backup_config_cron_pkey PRIMARY KEY (id);
ALTER TABLE backups_historial ADD CONSTRAINT backups_historial_pkey PRIMARY KEY (id);
ALTER TABLE blog_comentarios ADD CONSTRAINT blog_comentarios_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying])::text[])));
ALTER TABLE blog_comentarios ADD CONSTRAINT blog_comentarios_nivel_check CHECK ((nivel <= 2));
ALTER TABLE blog_comentarios ADD CONSTRAINT blog_comentarios_pkey PRIMARY KEY (id_comentario);
ALTER TABLE blog_etiquetas ADD CONSTRAINT blog_etiquetas_nombre_key UNIQUE (nombre);
ALTER TABLE blog_etiquetas ADD CONSTRAINT blog_etiquetas_pkey PRIMARY KEY (id_blog_etiqueta);
ALTER TABLE blog_etiquetas ADD CONSTRAINT blog_etiquetas_slug_key UNIQUE (slug);
ALTER TABLE blog_imagenes ADD CONSTRAINT blog_imagenes_pkey PRIMARY KEY (id_blog_imagen);
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_autor_rol_check CHECK (((autor_rol)::text = ANY ((ARRAY['admin'::character varying, 'artista'::character varying])::text[])));
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id_post);
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);
ALTER TABLE blog_posts_etiquetas ADD CONSTRAINT blog_posts_etiquetas_id_post_id_blog_etiqueta_key UNIQUE (id_post, id_blog_etiqueta);
ALTER TABLE blog_posts_etiquetas ADD CONSTRAINT blog_posts_etiquetas_pkey PRIMARY KEY (id);
ALTER TABLE blog_posts_relacionados ADD CONSTRAINT blog_posts_relacionados_pkey PRIMARY KEY (id_post, id_post_relacionado);
ALTER TABLE blog_reacciones ADD CONSTRAINT blog_reacciones_emoji_check CHECK (((char_length((emoji)::text) >= 1) AND (char_length((emoji)::text) <= 16)));
ALTER TABLE blog_reacciones ADD CONSTRAINT blog_reacciones_pkey PRIMARY KEY (id_reaccion);
ALTER TABLE blog_reacciones ADD CONSTRAINT uq_blog_reacciones_post_usuario UNIQUE (id_post, id_usuario);
ALTER TABLE carritos ADD CONSTRAINT carritos_cantidad_check CHECK ((cantidad > 0));
ALTER TABLE carritos ADD CONSTRAINT "carritos_id_usuario_id_obra_id_obra_tamaño_id_tipo_marco_key" UNIQUE (id_usuario, id_obra, "id_obra_tamaño", id_tipo_marco);
ALTER TABLE carritos ADD CONSTRAINT carritos_pkey PRIMARY KEY (id_carrito);
ALTER TABLE categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id_categoria);
ALTER TABLE categorias ADD CONSTRAINT categorias_slug_key UNIQUE (slug);
ALTER TABLE categorias_materiales ADD CONSTRAINT categorias_materiales_pkey PRIMARY KEY (id_categoria, id_material);
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_id_obra_key UNIQUE (id_obra);
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_numero_serie_key UNIQUE (numero_serie);
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_pkey PRIMARY KEY (id_certificado);
ALTER TABLE certificados_fotos_detalle ADD CONSTRAINT certificados_fotos_detalle_pkey PRIMARY KEY (id_foto);
ALTER TABLE certificados_historial ADD CONSTRAINT certificados_historial_pkey PRIMARY KEY (id_historial);
ALTER TABLE codigos_2fa_email ADD CONSTRAINT codigos_2fa_email_pkey PRIMARY KEY (id_codigo);
ALTER TABLE codigos_recuperacion ADD CONSTRAINT codigos_recuperacion_pkey PRIMARY KEY (id_codigo);
ALTER TABLE codigos_vinculacion ADD CONSTRAINT codigos_vinculacion_pkey PRIMARY KEY (id);
ALTER TABLE colecciones ADD CONSTRAINT colecciones_pkey PRIMARY KEY (id_coleccion);
ALTER TABLE colecciones ADD CONSTRAINT colecciones_slug_key UNIQUE (slug);
ALTER TABLE comisiones ADD CONSTRAINT comisiones_monto_comision_check CHECK ((monto_comision >= (0)::numeric));
ALTER TABLE comisiones ADD CONSTRAINT comisiones_monto_neto_artista_check CHECK ((monto_neto_artista > (0)::numeric));
ALTER TABLE comisiones ADD CONSTRAINT comisiones_monto_venta_check CHECK ((monto_venta > (0)::numeric));
ALTER TABLE comisiones ADD CONSTRAINT comisiones_pkey PRIMARY KEY (id_comision);
ALTER TABLE configuracion_sistema ADD CONSTRAINT configuracion_sistema_clave_key UNIQUE (clave);
ALTER TABLE configuracion_sistema ADD CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (id_configuracion);
ALTER TABLE conversaciones_venta ADD CONSTRAINT conversaciones_venta_pkey PRIMARY KEY (id_conversacion);
ALTER TABLE conversaciones_venta ADD CONSTRAINT conversaciones_venta_tipo_remitente_check CHECK (((tipo_remitente)::text = ANY (ARRAY[('cliente'::character varying)::text, ('artista'::character varying)::text])));
ALTER TABLE cupones ADD CONSTRAINT cupones_codigo_key UNIQUE (codigo);
ALTER TABLE cupones ADD CONSTRAINT cupones_pkey PRIMARY KEY (id_cupon);
ALTER TABLE cupones ADD CONSTRAINT cupones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['porcentaje'::character varying, 'fijo'::character varying])::text[])));
ALTER TABLE cupones_usados ADD CONSTRAINT cupones_usados_pkey PRIMARY KEY (id);
ALTER TABLE direcciones ADD CONSTRAINT direcciones_pkey PRIMARY KEY (id_direccion);
ALTER TABLE estados_mexico ADD CONSTRAINT estados_mexico_codigo_key UNIQUE (codigo);
ALTER TABLE estados_mexico ADD CONSTRAINT estados_mexico_nombre_key UNIQUE (nombre);
ALTER TABLE estados_mexico ADD CONSTRAINT estados_mexico_pkey PRIMARY KEY (id_estado);
ALTER TABLE etiquetas ADD CONSTRAINT etiquetas_pkey PRIMARY KEY (id_etiqueta);
ALTER TABLE etiquetas ADD CONSTRAINT etiquetas_slug_key UNIQUE (slug);
ALTER TABLE favoritos ADD CONSTRAINT favoritos_id_usuario_id_obra_key UNIQUE (id_usuario, id_obra);
ALTER TABLE favoritos ADD CONSTRAINT favoritos_pkey PRIMARY KEY (id_favorito);
ALTER TABLE historial_cambios_obras ADD CONSTRAINT historial_cambios_obras_pkey PRIMARY KEY (id_cambio);
ALTER TABLE historial_login ADD CONSTRAINT historial_login_pkey PRIMARY KEY (id_historial);
ALTER TABLE imagenes_obras ADD CONSTRAINT imagenes_obras_pkey PRIMARY KEY (id_imagen);
ALTER TABLE inventario ADD CONSTRAINT inventario_id_obra_key UNIQUE (id_obra);
ALTER TABLE inventario ADD CONSTRAINT inventario_pkey PRIMARY KEY (id_inventario);
ALTER TABLE inventario ADD CONSTRAINT inventario_stock_actual_check CHECK ((stock_actual >= 0));
ALTER TABLE inventario ADD CONSTRAINT inventario_stock_reservado_check CHECK ((stock_reservado >= 0));
ALTER TABLE inventario ADD CONSTRAINT inventario_stock_vendido_check CHECK ((stock_vendido >= 0));
ALTER TABLE liquidaciones_artistas ADD CONSTRAINT liquidaciones_artistas_monto_total_check CHECK ((monto_total > (0)::numeric));
ALTER TABLE liquidaciones_artistas ADD CONSTRAINT liquidaciones_artistas_pkey PRIMARY KEY (id_liquidacion);
ALTER TABLE materiales ADD CONSTRAINT materiales_nombre_key UNIQUE (nombre);
ALTER TABLE materiales ADD CONSTRAINT materiales_pkey PRIMARY KEY (id_material);
ALTER TABLE mensajes ADD CONSTRAINT mensajes_check CHECK ((id_remitente <> id_destinatario));
ALTER TABLE mensajes ADD CONSTRAINT mensajes_pkey PRIMARY KEY (id_mensaje);
ALTER TABLE mensajes_adjuntos ADD CONSTRAINT mensajes_adjuntos_pkey PRIMARY KEY (id_adjunto);
ALTER TABLE metodos_pago ADD CONSTRAINT metodos_pago_codigo_key UNIQUE (codigo);
ALTER TABLE metodos_pago ADD CONSTRAINT metodos_pago_comision_porcentaje_check CHECK (((comision_porcentaje >= (0)::numeric) AND (comision_porcentaje <= (100)::numeric)));
ALTER TABLE metodos_pago ADD CONSTRAINT metodos_pago_nombre_key UNIQUE (nombre);
ALTER TABLE metodos_pago ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id_metodo_pago);
ALTER TABLE monitoreo_historial ADD CONSTRAINT monitoreo_historial_pkey PRIMARY KEY (id);
ALTER TABLE municipios ADD CONSTRAINT municipios_id_estado_nombre_key UNIQUE (id_estado, nombre);
ALTER TABLE municipios ADD CONSTRAINT municipios_pkey PRIMARY KEY (id_municipio);
ALTER TABLE obras ADD CONSTRAINT obras_anio_creacion_check CHECK (((anio_creacion IS NULL) OR ((anio_creacion)::numeric <= EXTRACT(year FROM CURRENT_DATE))));
ALTER TABLE obras ADD CONSTRAINT obras_dimensiones_alto_check CHECK (((dimensiones_alto IS NULL) OR (dimensiones_alto > (0)::numeric)));
ALTER TABLE obras ADD CONSTRAINT obras_dimensiones_ancho_check CHECK (((dimensiones_ancho IS NULL) OR (dimensiones_ancho > (0)::numeric)));
ALTER TABLE obras ADD CONSTRAINT obras_pkey PRIMARY KEY (id_obra);
ALTER TABLE obras ADD CONSTRAINT obras_slug_key UNIQUE (slug);
ALTER TABLE obras_etiquetas ADD CONSTRAINT obras_etiquetas_id_obra_id_etiqueta_key UNIQUE (id_obra, id_etiqueta);
ALTER TABLE obras_etiquetas ADD CONSTRAINT obras_etiquetas_pkey PRIMARY KEY (id);
ALTER TABLE obras_marcos ADD CONSTRAINT "obras_marcos_id_obra_tamaño_id_tipo_marco_key" UNIQUE ("id_obra_tamaño", id_tipo_marco);
ALTER TABLE obras_marcos ADD CONSTRAINT obras_marcos_pkey PRIMARY KEY (id);
ALTER TABLE obras_marcos ADD CONSTRAINT obras_marcos_precio_total_check CHECK ((precio_total >= (0)::numeric));
ALTER TABLE "obras_tamaños" ADD CONSTRAINT "obras_tamaños_cantidad_disponible_check" CHECK ((cantidad_disponible >= 0));
ALTER TABLE "obras_tamaños" ADD CONSTRAINT "obras_tamaños_id_obra_id_tamaño_key" UNIQUE (id_obra, "id_tamaño");
ALTER TABLE "obras_tamaños" ADD CONSTRAINT "obras_tamaños_pkey" PRIMARY KEY (id);
ALTER TABLE "obras_tamaños" ADD CONSTRAINT "obras_tamaños_precio_base_check" CHECK ((precio_base > (0)::numeric));
ALTER TABLE palabras_prohibidas ADD CONSTRAINT palabras_prohibidas_palabra_key UNIQUE (palabra);
ALTER TABLE palabras_prohibidas ADD CONSTRAINT palabras_prohibidas_pkey PRIMARY KEY (id_palabra);
ALTER TABLE paqueterias ADD CONSTRAINT paqueterias_codigo_key UNIQUE (codigo);
ALTER TABLE paqueterias ADD CONSTRAINT paqueterias_nombre_key UNIQUE (nombre);
ALTER TABLE paqueterias ADD CONSTRAINT paqueterias_pkey PRIMARY KEY (id_paqueteria);
ALTER TABLE pedidos ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id_pedido);
ALTER TABLE preguntas_frecuentes ADD CONSTRAINT preguntas_frecuentes_pkey PRIMARY KEY (id_pregunta);
ALTER TABLE sesiones_activas ADD CONSTRAINT sesiones_activas_pkey PRIMARY KEY (id_sesion);
ALTER TABLE sesiones_activas ADD CONSTRAINT sesiones_activas_token_key UNIQUE (token);
ALTER TABLE sobre_nosotros ADD CONSTRAINT sobre_nosotros_pkey PRIMARY KEY (id);
ALTER TABLE "tamaños_disponibles" ADD CONSTRAINT "tamaños_disponibles_check" CHECK (((ancho_cm > (0)::numeric) AND (alto_cm > (0)::numeric)));
ALTER TABLE "tamaños_disponibles" ADD CONSTRAINT "tamaños_disponibles_nombre_key" UNIQUE (nombre);
ALTER TABLE "tamaños_disponibles" ADD CONSTRAINT "tamaños_disponibles_pkey" PRIMARY KEY ("id_tamaño");
ALTER TABLE tecnicas ADD CONSTRAINT tecnicas_id_categoria_nombre_key UNIQUE (id_categoria, nombre);
ALTER TABLE tecnicas ADD CONSTRAINT tecnicas_pkey PRIMARY KEY (id_tecnica);
ALTER TABLE testimonios ADD CONSTRAINT testimonios_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5)));
ALTER TABLE testimonios ADD CONSTRAINT testimonios_pkey PRIMARY KEY (id_testimonio);
ALTER TABLE tickets_soporte ADD CONSTRAINT tickets_soporte_pkey PRIMARY KEY (id_ticket);
ALTER TABLE tipos_certificado ADD CONSTRAINT tipos_certificado_codigo_key UNIQUE (codigo);
ALTER TABLE tipos_certificado ADD CONSTRAINT tipos_certificado_nombre_key UNIQUE (nombre);
ALTER TABLE tipos_certificado ADD CONSTRAINT tipos_certificado_pkey PRIMARY KEY (id_tipo_certificado);
ALTER TABLE tipos_marco ADD CONSTRAINT tipos_marco_pkey PRIMARY KEY (id_tipo_marco);
ALTER TABLE tipos_marco ADD CONSTRAINT tipos_marco_precio_adicional_check CHECK ((precio_adicional >= (0)::numeric));
ALTER TABLE trayectoria ADD CONSTRAINT trayectoria_pkey PRIMARY KEY (id);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_metodo_2fa_check CHECK (((metodo_2fa)::text = ANY (ARRAY[('NINGUNO'::character varying)::text, ('TOTP'::character varying)::text, ('GMAIL'::character varying)::text])));
ALTER TABLE usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);
ALTER TABLE ventas ADD CONSTRAINT ventas_cantidad_check CHECK ((cantidad > 0));
ALTER TABLE ventas ADD CONSTRAINT ventas_pkey PRIMARY KEY (id_venta);
ALTER TABLE ventas ADD CONSTRAINT ventas_precio_unitario_check CHECK ((precio_unitario > (0)::numeric));
ALTER TABLE ventas ADD CONSTRAINT ventas_total_check CHECK ((total > (0)::numeric));
ALTER TABLE vinculaciones ADD CONSTRAINT vinculaciones_alexa_user_id_key UNIQUE (alexa_user_id);
ALTER TABLE vinculaciones ADD CONSTRAINT vinculaciones_pkey PRIMARY KEY (id);

-- 9. Índices
CREATE INDEX idx_2fa_expiracion ON public.codigos_2fa_email USING btree (fecha_expiracion);
CREATE INDEX idx_2fa_usuario ON public.codigos_2fa_email USING btree (id_usuario, usado);
CREATE INDEX idx_artistas_activo ON public.artistas USING btree (activo, eliminado);
CREATE INDEX idx_artistas_categoria ON public.artistas USING btree (id_categoria_principal);
CREATE INDEX idx_artistas_estado ON public.artistas USING btree (estado);
CREATE INDEX idx_artistas_fotos_personales_artista ON public.artistas_fotos_personales USING btree (id_artista, activa, orden);
CREATE INDEX idx_artistas_matricula ON public.artistas USING btree (matricula);
CREATE INDEX idx_artistas_usuario ON public.artistas USING btree (id_usuario);
CREATE INDEX idx_blog_busqueda ON public.blog_posts USING gin (to_tsvector('spanish'::regconfig, (((titulo)::text || ' '::text) || contenido)));
CREATE INDEX idx_blog_etiquetas_slug ON public.blog_etiquetas USING btree (slug);
CREATE INDEX idx_blog_imagenes_post ON public.blog_imagenes USING btree (id_post, orden);
CREATE INDEX idx_blog_posts_categoria ON public.blog_posts USING btree (id_categoria);
CREATE INDEX idx_blog_posts_estado ON public.blog_posts USING btree (estado);
CREATE INDEX idx_blog_posts_etiquetas_etiqueta ON public.blog_posts_etiquetas USING btree (id_blog_etiqueta);
CREATE INDEX idx_blog_posts_etiquetas_post ON public.blog_posts_etiquetas USING btree (id_post);
CREATE INDEX idx_blog_posts_fecha ON public.blog_posts USING btree (fecha_publicacion DESC);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);
CREATE INDEX idx_blog_reacciones_post ON public.blog_reacciones USING btree (id_post);
CREATE INDEX idx_bpr_id_post ON public.blog_posts_relacionados USING btree (id_post);
CREATE INDEX idx_carritos_obra ON public.carritos USING btree (id_obra);
CREATE INDEX idx_carritos_usuario ON public.carritos USING btree (id_usuario, activo);
CREATE INDEX idx_carritos_usuario_activo ON public.carritos USING btree (id_usuario, activo);
CREATE INDEX idx_categorias_activa ON public.categorias USING btree (activa, eliminada);
CREATE INDEX idx_categorias_slug ON public.categorias USING btree (slug);
CREATE INDEX idx_certificados_artista ON public.certificados_autenticidad USING btree (id_artista);
CREATE INDEX idx_certificados_fotos ON public.certificados_fotos_detalle USING btree (id_certificado, orden);
CREATE INDEX idx_certificados_historial ON public.certificados_historial USING btree (id_certificado, created_at DESC);
CREATE INDEX idx_certificados_numero_serie ON public.certificados_autenticidad USING btree (numero_serie);
CREATE INDEX idx_certificados_obra ON public.certificados_autenticidad USING btree (id_obra);
CREATE INDEX idx_certificados_verificado ON public.certificados_autenticidad USING btree (verificado);
CREATE INDEX idx_codigos_codigo ON public.codigos_vinculacion USING btree (codigo, usado);
CREATE INDEX idx_colecciones_artista ON public.colecciones USING btree (id_artista, activa);
CREATE INDEX idx_colecciones_estado ON public.colecciones USING btree (estado, activa);
CREATE INDEX idx_colecciones_programadas ON public.colecciones USING btree (fecha_publicacion_programada) WHERE ((estado)::text = 'programada'::text);
CREATE INDEX idx_colecciones_slug ON public.colecciones USING btree (slug);
CREATE INDEX idx_comisiones_artista ON public.comisiones USING btree (id_artista, estado);
CREATE INDEX idx_comisiones_venta ON public.comisiones USING btree (id_venta);
CREATE INDEX idx_configuracion_clave ON public.configuracion_sistema USING btree (clave);
CREATE INDEX idx_direcciones_estado ON public.direcciones USING btree (id_estado);
CREATE INDEX idx_direcciones_municipio ON public.direcciones USING btree (id_municipio);
CREATE UNIQUE INDEX idx_direcciones_principal_unica ON public.direcciones USING btree (id_usuario, tipo) WHERE ((es_principal = true) AND (eliminada = false));
CREATE INDEX idx_direcciones_usuario ON public.direcciones USING btree (id_usuario, activa);
CREATE INDEX idx_estados_codigo ON public.estados_mexico USING btree (codigo);
CREATE INDEX idx_etiquetas_activa ON public.etiquetas USING btree (activa, eliminada);
CREATE INDEX idx_etiquetas_slug ON public.etiquetas USING btree (slug);
CREATE INDEX idx_faq_activa ON public.preguntas_frecuentes USING btree (activa, eliminada);
CREATE INDEX idx_faq_categoria ON public.preguntas_frecuentes USING btree (categoria, orden);
CREATE INDEX idx_favoritos_obra ON public.favoritos USING btree (id_obra);
CREATE INDEX idx_favoritos_usuario ON public.favoritos USING btree (id_usuario, activo);
CREATE INDEX idx_favoritos_usuario_obra ON public.favoritos USING btree (id_usuario, id_obra);
CREATE INDEX idx_historial_fecha ON public.historial_cambios_obras USING btree (fecha_cambio DESC);
CREATE INDEX idx_historial_obra ON public.historial_cambios_obras USING btree (id_obra);
CREATE INDEX idx_historial_tipo ON public.historial_login USING btree (tipo_evento, fecha DESC);
CREATE INDEX idx_historial_usuario ON public.historial_login USING btree (id_usuario, fecha DESC);
CREATE INDEX idx_historial_usuario_obra ON public.historial_cambios_obras USING btree (id_usuario);
CREATE INDEX idx_imagenes_obra ON public.imagenes_obras USING btree (id_obra);
CREATE INDEX idx_imagenes_orden ON public.imagenes_obras USING btree (id_obra, orden, activa);
CREATE INDEX idx_inventario_obra ON public.inventario USING btree (id_obra);
CREATE INDEX idx_liquidaciones_artista ON public.liquidaciones_artistas USING btree (id_artista);
CREATE INDEX idx_mensajes_adjuntos ON public.mensajes_adjuntos USING btree (id_mensaje);
CREATE INDEX idx_mensajes_destinatario ON public.mensajes USING btree (id_destinatario, eliminado_destinatario, leido);
CREATE INDEX idx_mensajes_hilo ON public.mensajes USING btree (hilo_id);
CREATE INDEX idx_mensajes_remitente ON public.mensajes USING btree (id_remitente, eliminado_remitente);
CREATE INDEX idx_metodo_2fa ON public.usuarios USING btree (metodo_2fa);
CREATE INDEX idx_metodos_pago_codigo ON public.metodos_pago USING btree (codigo);
CREATE INDEX idx_municipios_estado ON public.municipios USING btree (id_estado, activo);
CREATE INDEX idx_obras_activa ON public.obras USING btree (activa);
CREATE INDEX idx_obras_artista ON public.obras USING btree (id_artista);
CREATE INDEX idx_obras_categoria ON public.obras USING btree (id_categoria);
CREATE INDEX idx_obras_certificada ON public.obras USING btree (con_certificado);
CREATE INDEX idx_obras_destacada ON public.obras USING btree (destacada);
CREATE INDEX idx_obras_estado ON public.obras USING btree (estado);
CREATE INDEX idx_obras_estado_activa ON public.obras USING btree (estado, activa) WHERE (eliminada IS NOT TRUE);
CREATE INDEX idx_obras_etiquetas_etiqueta ON public.obras_etiquetas USING btree (id_etiqueta);
CREATE INDEX idx_obras_etiquetas_obra ON public.obras_etiquetas USING btree (id_obra);
CREATE INDEX "idx_obras_marcos_obra_tamaño" ON public.obras_marcos USING btree ("id_obra_tamaño", activo);
CREATE INDEX idx_obras_programadas ON public.obras USING btree (fecha_publicacion_programada) WHERE ((estado)::text = 'programada'::text);
CREATE INDEX idx_obras_slug ON public.obras USING btree (slug);
CREATE INDEX "idx_obras_tamaños_obra" ON public."obras_tamaños" USING btree (id_obra, activo);
CREATE INDEX "idx_obras_tamaños_tamaño" ON public."obras_tamaños" USING btree ("id_tamaño", activo);
CREATE INDEX idx_obras_tecnica ON public.obras USING btree (id_tecnica);
CREATE INDEX idx_obras_visible ON public.obras USING btree (visible, activa);
CREATE INDEX idx_paqueterias_codigo ON public.paqueterias USING btree (codigo);
CREATE INDEX idx_portafolio_artista ON public.artistas_portafolio USING btree (id_artista, activo, orden);
CREATE INDEX idx_recuperacion_expiracion ON public.codigos_recuperacion USING btree (fecha_expiracion);
CREATE INDEX idx_recuperacion_usuario ON public.codigos_recuperacion USING btree (id_usuario, usado);
CREATE INDEX idx_redes_artista ON public.artistas_redes_sociales USING btree (id_artista, activo);
CREATE INDEX idx_sesiones_expiracion ON public.sesiones_activas USING btree (fecha_expiracion);
CREATE INDEX idx_sesiones_token ON public.sesiones_activas USING btree (token);
CREATE INDEX idx_sesiones_token_hash ON public.sesiones_activas USING btree (token_hash);
CREATE INDEX idx_sesiones_usuario_activa ON public.sesiones_activas USING btree (id_usuario, activa);
CREATE INDEX idx_tamanos_activo ON public."tamaños_disponibles" USING btree (activo, eliminado);
CREATE INDEX idx_tecnicas_categoria ON public.tecnicas USING btree (id_categoria, activa);
CREATE INDEX idx_testimonios_usuario ON public.testimonios USING btree (id_usuario);
CREATE INDEX idx_testimonios_visible ON public.testimonios USING btree (visible, activo);
CREATE INDEX idx_tickets_asignado ON public.tickets_soporte USING btree (id_asignado_a);
CREATE INDEX idx_tickets_estado ON public.tickets_soporte USING btree (estado);
CREATE INDEX idx_tickets_prioridad ON public.tickets_soporte USING btree (prioridad);
CREATE INDEX idx_tickets_usuario ON public.tickets_soporte USING btree (id_usuario);
CREATE INDEX idx_tipos_certificado_codigo ON public.tipos_certificado USING btree (codigo);
CREATE INDEX idx_tipos_marco_activo ON public.tipos_marco USING btree (activo, eliminado);
CREATE INDEX idx_usuarios_activo ON public.usuarios USING btree (activo, eliminado);
CREATE INDEX idx_usuarios_bloqueado ON public.usuarios USING btree (bloqueado_hasta);
CREATE INDEX idx_usuarios_correo ON public.usuarios USING btree (correo);
CREATE INDEX idx_usuarios_estado ON public.usuarios USING btree (estado);
CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (rol);
CREATE INDEX idx_usuarios_verificado ON public.usuarios USING btree (verificado);
CREATE INDEX idx_ventas_artista ON public.ventas USING btree (id_artista);
CREATE INDEX idx_ventas_cancelado ON public.ventas USING btree (cancelado);
CREATE INDEX idx_ventas_cliente ON public.ventas USING btree (id_cliente);
CREATE INDEX idx_ventas_cliente_fecha ON public.ventas USING btree (id_cliente, fecha_venta DESC);
CREATE INDEX idx_ventas_estado ON public.ventas USING btree (estado);
CREATE INDEX idx_ventas_fecha ON public.ventas USING btree (fecha_venta DESC);
CREATE INDEX idx_ventas_obra ON public.ventas USING btree (id_obra);

-- 10. Llaves foráneas
ALTER TABLE artistas ADD CONSTRAINT artistas_aprobado_por_fkey FOREIGN KEY (aprobado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE artistas ADD CONSTRAINT artistas_eliminado_por_fkey FOREIGN KEY (eliminado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE artistas ADD CONSTRAINT artistas_id_categoria_principal_fkey FOREIGN KEY (id_categoria_principal) REFERENCES categorias(id_categoria);
ALTER TABLE artistas ADD CONSTRAINT artistas_id_estado_base_fkey FOREIGN KEY (id_estado_base) REFERENCES estados_mexico(id_estado);
ALTER TABLE artistas ADD CONSTRAINT artistas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE artistas_datos_bancarios ADD CONSTRAINT artistas_datos_bancarios_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista) ON DELETE CASCADE;
ALTER TABLE artistas_datos_bancarios ADD CONSTRAINT artistas_datos_bancarios_verificado_por_fkey FOREIGN KEY (verificado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE artistas_fotos_personales ADD CONSTRAINT artistas_fotos_personales_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista) ON DELETE CASCADE;
ALTER TABLE artistas_metodos_envio ADD CONSTRAINT artistas_metodos_envio_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista) ON DELETE CASCADE;
ALTER TABLE artistas_portafolio ADD CONSTRAINT artistas_portafolio_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista) ON DELETE CASCADE;
ALTER TABLE artistas_redes_sociales ADD CONSTRAINT artistas_redes_sociales_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista) ON DELETE CASCADE;
ALTER TABLE artistas_zonas_envio ADD CONSTRAINT artistas_zonas_envio_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista) ON DELETE CASCADE;
ALTER TABLE artistas_zonas_envio ADD CONSTRAINT artistas_zonas_envio_id_estado_fkey FOREIGN KEY (id_estado) REFERENCES estados_mexico(id_estado);
ALTER TABLE artistas_zonas_envio ADD CONSTRAINT artistas_zonas_envio_id_municipio_fkey FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio);
ALTER TABLE backup_config_cron ADD CONSTRAINT backup_config_cron_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
ALTER TABLE backups_historial ADD CONSTRAINT backups_historial_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
ALTER TABLE blog_comentarios ADD CONSTRAINT blog_comentarios_eliminado_por_fkey FOREIGN KEY (eliminado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE blog_comentarios ADD CONSTRAINT blog_comentarios_id_post_fkey FOREIGN KEY (id_post) REFERENCES blog_posts(id_post) ON DELETE CASCADE;
ALTER TABLE blog_comentarios ADD CONSTRAINT blog_comentarios_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE blog_comentarios ADD CONSTRAINT blog_comentarios_padre_id_fkey FOREIGN KEY (padre_id) REFERENCES blog_comentarios(id_comentario);
ALTER TABLE blog_imagenes ADD CONSTRAINT blog_imagenes_id_post_fkey FOREIGN KEY (id_post) REFERENCES blog_posts(id_post) ON DELETE CASCADE;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES usuarios(id_usuario);
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_eliminado_por_fkey FOREIGN KEY (eliminado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria);
ALTER TABLE blog_posts_etiquetas ADD CONSTRAINT blog_posts_etiquetas_id_blog_etiqueta_fkey FOREIGN KEY (id_blog_etiqueta) REFERENCES blog_etiquetas(id_blog_etiqueta) ON DELETE CASCADE;
ALTER TABLE blog_posts_etiquetas ADD CONSTRAINT blog_posts_etiquetas_id_post_fkey FOREIGN KEY (id_post) REFERENCES blog_posts(id_post) ON DELETE CASCADE;
ALTER TABLE blog_posts_relacionados ADD CONSTRAINT blog_posts_relacionados_id_post_fkey FOREIGN KEY (id_post) REFERENCES blog_posts(id_post) ON DELETE CASCADE;
ALTER TABLE blog_posts_relacionados ADD CONSTRAINT blog_posts_relacionados_id_post_relacionado_fkey FOREIGN KEY (id_post_relacionado) REFERENCES blog_posts(id_post) ON DELETE CASCADE;
ALTER TABLE blog_reacciones ADD CONSTRAINT blog_reacciones_id_post_fkey FOREIGN KEY (id_post) REFERENCES blog_posts(id_post) ON DELETE CASCADE;
ALTER TABLE blog_reacciones ADD CONSTRAINT blog_reacciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
ALTER TABLE carritos ADD CONSTRAINT carritos_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra);
ALTER TABLE carritos ADD CONSTRAINT "carritos_id_obra_tamaño_fkey" FOREIGN KEY ("id_obra_tamaño") REFERENCES "obras_tamaños"(id);
ALTER TABLE carritos ADD CONSTRAINT carritos_id_tipo_marco_fkey FOREIGN KEY (id_tipo_marco) REFERENCES tipos_marco(id_tipo_marco);
ALTER TABLE carritos ADD CONSTRAINT carritos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE categorias_materiales ADD CONSTRAINT categorias_materiales_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE;
ALTER TABLE categorias_materiales ADD CONSTRAINT categorias_materiales_id_material_fkey FOREIGN KEY (id_material) REFERENCES materiales(id_material) ON DELETE CASCADE;
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista);
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra) ON DELETE CASCADE;
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_id_tipo_certificado_fkey FOREIGN KEY (id_tipo_certificado) REFERENCES tipos_certificado(id_tipo_certificado);
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_revocado_por_fkey FOREIGN KEY (revocado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE certificados_autenticidad ADD CONSTRAINT certificados_autenticidad_verificado_por_fkey FOREIGN KEY (verificado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE certificados_fotos_detalle ADD CONSTRAINT certificados_fotos_detalle_id_certificado_fkey FOREIGN KEY (id_certificado) REFERENCES certificados_autenticidad(id_certificado) ON DELETE CASCADE;
ALTER TABLE certificados_historial ADD CONSTRAINT certificados_historial_id_certificado_fkey FOREIGN KEY (id_certificado) REFERENCES certificados_autenticidad(id_certificado) ON DELETE CASCADE;
ALTER TABLE certificados_historial ADD CONSTRAINT certificados_historial_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE codigos_2fa_email ADD CONSTRAINT codigos_2fa_email_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
ALTER TABLE codigos_recuperacion ADD CONSTRAINT codigos_recuperacion_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
ALTER TABLE codigos_vinculacion ADD CONSTRAINT codigos_vinculacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario);
ALTER TABLE colecciones ADD CONSTRAINT colecciones_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista);
ALTER TABLE comisiones ADD CONSTRAINT comisiones_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista);
ALTER TABLE comisiones ADD CONSTRAINT comisiones_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES ventas(id_venta);
ALTER TABLE conversaciones_venta ADD CONSTRAINT conversaciones_venta_id_remitente_fkey FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario);
ALTER TABLE conversaciones_venta ADD CONSTRAINT conversaciones_venta_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE;
ALTER TABLE cupones_usados ADD CONSTRAINT cupones_usados_id_cupon_fkey FOREIGN KEY (id_cupon) REFERENCES cupones(id_cupon);
ALTER TABLE cupones_usados ADD CONSTRAINT cupones_usados_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido);
ALTER TABLE direcciones ADD CONSTRAINT direcciones_id_estado_fkey FOREIGN KEY (id_estado) REFERENCES estados_mexico(id_estado);
ALTER TABLE direcciones ADD CONSTRAINT direcciones_id_municipio_fkey FOREIGN KEY (id_municipio) REFERENCES municipios(id_municipio);
ALTER TABLE direcciones ADD CONSTRAINT direcciones_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE favoritos ADD CONSTRAINT favoritos_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra);
ALTER TABLE favoritos ADD CONSTRAINT favoritos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE historial_cambios_obras ADD CONSTRAINT historial_cambios_obras_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra) ON DELETE CASCADE;
ALTER TABLE historial_cambios_obras ADD CONSTRAINT historial_cambios_obras_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE historial_login ADD CONSTRAINT historial_login_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL;
ALTER TABLE imagenes_obras ADD CONSTRAINT imagenes_obras_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra) ON DELETE CASCADE;
ALTER TABLE inventario ADD CONSTRAINT inventario_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra);
ALTER TABLE liquidaciones_artistas ADD CONSTRAINT liquidaciones_artistas_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario);
ALTER TABLE liquidaciones_artistas ADD CONSTRAINT liquidaciones_artistas_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista);
ALTER TABLE mensajes ADD CONSTRAINT mensajes_id_destinatario_fkey FOREIGN KEY (id_destinatario) REFERENCES usuarios(id_usuario);
ALTER TABLE mensajes ADD CONSTRAINT mensajes_id_remitente_fkey FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario);
ALTER TABLE mensajes_adjuntos ADD CONSTRAINT mensajes_adjuntos_id_mensaje_fkey FOREIGN KEY (id_mensaje) REFERENCES mensajes(id_mensaje) ON DELETE CASCADE;
ALTER TABLE municipios ADD CONSTRAINT municipios_id_estado_fkey FOREIGN KEY (id_estado) REFERENCES estados_mexico(id_estado);
ALTER TABLE obras ADD CONSTRAINT obras_aprobado_por_fkey FOREIGN KEY (aprobado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE obras ADD CONSTRAINT obras_eliminado_por_fkey FOREIGN KEY (eliminado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE obras ADD CONSTRAINT obras_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista);
ALTER TABLE obras ADD CONSTRAINT obras_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria);
ALTER TABLE obras ADD CONSTRAINT obras_id_coleccion_fkey FOREIGN KEY (id_coleccion) REFERENCES colecciones(id_coleccion);
ALTER TABLE obras ADD CONSTRAINT obras_id_material_fkey FOREIGN KEY (id_material) REFERENCES materiales(id_material);
ALTER TABLE obras ADD CONSTRAINT obras_id_tecnica_fkey FOREIGN KEY (id_tecnica) REFERENCES tecnicas(id_tecnica);
ALTER TABLE obras ADD CONSTRAINT obras_id_usuario_actualizacion_fkey FOREIGN KEY (id_usuario_actualizacion) REFERENCES usuarios(id_usuario);
ALTER TABLE obras ADD CONSTRAINT obras_id_usuario_creacion_fkey FOREIGN KEY (id_usuario_creacion) REFERENCES usuarios(id_usuario);
ALTER TABLE obras_etiquetas ADD CONSTRAINT obras_etiquetas_id_etiqueta_fkey FOREIGN KEY (id_etiqueta) REFERENCES etiquetas(id_etiqueta) ON DELETE CASCADE;
ALTER TABLE obras_etiquetas ADD CONSTRAINT obras_etiquetas_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra) ON DELETE CASCADE;
ALTER TABLE obras_marcos ADD CONSTRAINT "obras_marcos_id_obra_tamaño_fkey" FOREIGN KEY ("id_obra_tamaño") REFERENCES "obras_tamaños"(id) ON DELETE CASCADE;
ALTER TABLE obras_marcos ADD CONSTRAINT obras_marcos_id_tipo_marco_fkey FOREIGN KEY (id_tipo_marco) REFERENCES tipos_marco(id_tipo_marco);
ALTER TABLE "obras_tamaños" ADD CONSTRAINT "obras_tamaños_id_obra_fkey" FOREIGN KEY (id_obra) REFERENCES obras(id_obra) ON DELETE CASCADE;
ALTER TABLE "obras_tamaños" ADD CONSTRAINT "obras_tamaños_id_tamaño_fkey" FOREIGN KEY ("id_tamaño") REFERENCES "tamaños_disponibles"("id_tamaño");
ALTER TABLE palabras_prohibidas ADD CONSTRAINT palabras_prohibidas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE pedidos ADD CONSTRAINT pedidos_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario);
ALTER TABLE pedidos ADD CONSTRAINT pedidos_id_cupon_fkey FOREIGN KEY (id_cupon) REFERENCES cupones(id_cupon);
ALTER TABLE pedidos ADD CONSTRAINT pedidos_id_direccion_envio_fkey FOREIGN KEY (id_direccion_envio) REFERENCES direcciones(id_direccion);
ALTER TABLE sesiones_activas ADD CONSTRAINT sesiones_activas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE;
ALTER TABLE tecnicas ADD CONSTRAINT tecnicas_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria);
ALTER TABLE testimonios ADD CONSTRAINT testimonios_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE tickets_soporte ADD CONSTRAINT tickets_soporte_id_asignado_a_fkey FOREIGN KEY (id_asignado_a) REFERENCES usuarios(id_usuario);
ALTER TABLE tickets_soporte ADD CONSTRAINT tickets_soporte_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario);
ALTER TABLE trayectoria ADD CONSTRAINT trayectoria_sobre_nosotros_id_fkey FOREIGN KEY (sobre_nosotros_id) REFERENCES sobre_nosotros(id);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_eliminado_por_fkey FOREIGN KEY (eliminado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE ventas ADD CONSTRAINT ventas_cancelado_por_fkey FOREIGN KEY (cancelado_por) REFERENCES usuarios(id_usuario);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_artista_fkey FOREIGN KEY (id_artista) REFERENCES artistas(id_artista);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_direccion_envio_fkey FOREIGN KEY (id_direccion_envio) REFERENCES direcciones(id_direccion);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_liquidacion_fkey FOREIGN KEY (id_liquidacion) REFERENCES liquidaciones_artistas(id_liquidacion);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_metodo_pago_fkey FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id_metodo_pago);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_obra_fkey FOREIGN KEY (id_obra) REFERENCES obras(id_obra);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_obra_tamano_fkey FOREIGN KEY (id_obra_tamano) REFERENCES "obras_tamaños"(id);
ALTER TABLE ventas ADD CONSTRAINT "ventas_id_obra_tamaño_fkey" FOREIGN KEY ("id_obra_tamaño") REFERENCES "obras_tamaños"(id);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_paqueteria_fkey FOREIGN KEY (id_paqueteria) REFERENCES paqueterias(id_paqueteria);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido);
ALTER TABLE ventas ADD CONSTRAINT ventas_id_tipo_marco_fkey FOREIGN KEY (id_tipo_marco) REFERENCES tipos_marco(id_tipo_marco);
ALTER TABLE vinculaciones ADD CONSTRAINT vinculaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario);

-- 11. Vistas

-- 12. Triggers
CREATE TRIGGER trigger_actualizar_artistas BEFORE UPDATE ON public.artistas FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_artistas_portafolio BEFORE UPDATE ON public.artistas_portafolio FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_artistas_redes BEFORE UPDATE ON public.artistas_redes_sociales FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_blog_etiquetas BEFORE UPDATE ON public.blog_etiquetas FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_blog_imagenes BEFORE UPDATE ON public.blog_imagenes FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_blog_posts BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_categorias BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_certificados_fotos BEFORE UPDATE ON public.certificados_fotos_detalle FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_configuracion BEFORE UPDATE ON public.configuracion_sistema FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_direcciones BEFORE UPDATE ON public.direcciones FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_estados_mexico BEFORE UPDATE ON public.estados_mexico FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_imagenes_obras BEFORE UPDATE ON public.imagenes_obras FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_metodos_pago BEFORE UPDATE ON public.metodos_pago FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_municipios BEFORE UPDATE ON public.municipios FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_obras BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_paqueterias BEFORE UPDATE ON public.paqueterias FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_preguntas BEFORE UPDATE ON public.preguntas_frecuentes FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_tecnicas BEFORE UPDATE ON public.tecnicas FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_tickets BEFORE UPDATE ON public.tickets_soporte FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_tipos_certificado BEFORE UPDATE ON public.tipos_certificado FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_actualizar_usuarios BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();
CREATE TRIGGER trigger_calc_comision BEFORE INSERT ON public.comisiones FOR EACH ROW EXECUTE FUNCTION calcular_comision();
CREATE TRIGGER trigger_matricula_artista AFTER INSERT ON public.artistas FOR EACH ROW EXECUTE FUNCTION generar_matricula_artista();
CREATE TRIGGER trigger_numero_serie_certificado AFTER INSERT ON public.certificados_autenticidad FOR EACH ROW EXECUTE FUNCTION generar_numero_serie_certificado();
CREATE TRIGGER trigger_sync_inventario BEFORE UPDATE ON public.inventario FOR EACH ROW EXECUTE FUNCTION sincronizar_inventario();
COMMIT;
