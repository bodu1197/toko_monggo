create type "public"."report_reason" as enum ('fraud', 'fake', 'spam', 'inappropriate', 'duplicate', 'other');

create type "public"."report_status" as enum ('pending', 'reviewing', 'resolved', 'rejected');

create type "public"."report_type" as enum ('product', 'user');

create sequence "public"."categories_category_id_seq";

create sequence "public"."provinces_province_id_seq";

create sequence "public"."regencies_regency_id_seq";

create table "public"."access_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "session_id" text,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "regency_id" integer,
    "user_agent" text,
    "page_url" text,
    "access_date" date default CURRENT_DATE,
    "created_at" timestamp with time zone default now()
);


alter table "public"."access_logs" enable row level security;

create table "public"."categories" (
    "category_id" integer not null default nextval('categories_category_id_seq'::regclass),
    "name" character varying(100) not null,
    "parent_category" character varying(100),
    "icon" character varying(50),
    "created_at" timestamp with time zone default now()
);


create table "public"."favorites" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "product_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."favorites" enable row level security;

create table "public"."product_comments" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "user_id" uuid not null,
    "parent_id" uuid,
    "comment" text not null,
    "rating" integer,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_seller_reply" boolean default false
);


alter table "public"."product_comments" enable row level security;

create table "public"."product_images" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "image_url" text not null,
    "order" integer not null default 0,
    "created_at" timestamp with time zone default now()
);


alter table "public"."product_images" enable row level security;

create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" character varying(100) not null,
    "description" text not null,
    "price" integer not null,
    "condition" character varying(50) not null,
    "is_negotiable" boolean default false,
    "status" character varying(20) not null default 'active'::character varying,
    "province_id" integer,
    "regency_id" integer,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "category_id" integer,
    "search_vector" tsvector,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."products" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "username" character varying(50),
    "full_name" character varying(100),
    "phone_number" character varying(20),
    "whatsapp_number" character varying(20),
    "avatar_url" text,
    "bio" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "role" character varying(20) default 'user'::character varying
);


alter table "public"."profiles" enable row level security;

create table "public"."provinces" (
    "province_id" integer not null default nextval('provinces_province_id_seq'::regclass),
    "province_name" character varying(100) not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."regencies" (
    "regency_id" integer not null default nextval('regencies_regency_id_seq'::regclass),
    "province_id" integer not null,
    "regency_name" character varying(100) not null,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "created_at" timestamp with time zone default now()
);


create table "public"."reports" (
    "id" uuid not null default gen_random_uuid(),
    "reporter_id" uuid,
    "report_type" report_type not null,
    "reported_product_id" uuid,
    "reported_user_id" uuid,
    "reason" report_reason not null,
    "description" text,
    "evidence_urls" text[],
    "status" report_status default 'pending'::report_status,
    "admin_note" text,
    "resolved_by" uuid,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."reports" enable row level security;

create table "public"."view_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "product_id" uuid not null,
    "viewed_at" timestamp with time zone default now()
);


alter table "public"."view_history" enable row level security;

alter sequence "public"."categories_category_id_seq" owned by "public"."categories"."category_id";

alter sequence "public"."provinces_province_id_seq" owned by "public"."provinces"."province_id";

alter sequence "public"."regencies_regency_id_seq" owned by "public"."regencies"."regency_id";

CREATE UNIQUE INDEX access_logs_pkey ON public.access_logs USING btree (id);

CREATE UNIQUE INDEX access_logs_session_id_access_date_key ON public.access_logs USING btree (session_id, access_date);

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (category_id);

CREATE UNIQUE INDEX favorites_pkey ON public.favorites USING btree (id);

CREATE UNIQUE INDEX favorites_user_id_product_id_key ON public.favorites USING btree (user_id, product_id);

CREATE INDEX idx_access_logs_date ON public.access_logs USING btree (access_date DESC);

CREATE INDEX idx_access_logs_regency ON public.access_logs USING btree (regency_id);

CREATE INDEX idx_access_logs_session ON public.access_logs USING btree (session_id, access_date);

CREATE INDEX idx_comments_parent ON public.product_comments USING btree (parent_id);

CREATE INDEX idx_comments_product ON public.product_comments USING btree (product_id, created_at DESC);

CREATE INDEX idx_comments_user ON public.product_comments USING btree (user_id);

CREATE INDEX idx_favorites_product ON public.favorites USING btree (product_id);

CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id, created_at DESC);

CREATE INDEX idx_product_comments_created ON public.product_comments USING btree (created_at DESC);

CREATE INDEX idx_product_comments_parent ON public.product_comments USING btree (parent_id);

CREATE INDEX idx_product_comments_product ON public.product_comments USING btree (product_id);

CREATE INDEX idx_product_comments_user ON public.product_comments USING btree (user_id);

CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id, "order");

CREATE INDEX idx_products_category ON public.products USING btree (category_id);

CREATE INDEX idx_products_created ON public.products USING btree (created_at DESC);

CREATE INDEX idx_products_location ON public.products USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));

CREATE INDEX idx_products_price ON public.products USING btree (price);

CREATE INDEX idx_products_regency ON public.products USING btree (regency_id);

CREATE INDEX idx_products_status ON public.products USING btree (status);

CREATE INDEX idx_products_user ON public.products USING btree (user_id);

CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);

CREATE INDEX idx_regencies_location ON public.regencies USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));

CREATE INDEX idx_reports_created ON public.reports USING btree (created_at DESC);

CREATE INDEX idx_reports_product ON public.reports USING btree (reported_product_id);

CREATE INDEX idx_reports_reporter ON public.reports USING btree (reporter_id);

CREATE INDEX idx_reports_status ON public.reports USING btree (status);

CREATE INDEX idx_reports_user ON public.reports USING btree (reported_user_id);

CREATE INDEX idx_view_history_user ON public.view_history USING btree (user_id, viewed_at DESC);

CREATE UNIQUE INDEX product_comments_pkey ON public.product_comments USING btree (id);

CREATE UNIQUE INDEX product_images_pkey ON public.product_images USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE INDEX products_search_idx ON public.products USING gin (search_vector);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX provinces_pkey ON public.provinces USING btree (province_id);

CREATE UNIQUE INDEX provinces_province_name_key ON public.provinces USING btree (province_name);

CREATE UNIQUE INDEX regencies_pkey ON public.regencies USING btree (regency_id);

CREATE UNIQUE INDEX regencies_province_id_regency_name_key ON public.regencies USING btree (province_id, regency_name);

CREATE UNIQUE INDEX reports_pkey ON public.reports USING btree (id);

CREATE UNIQUE INDEX view_history_pkey ON public.view_history USING btree (id);

CREATE UNIQUE INDEX view_history_user_id_product_id_key ON public.view_history USING btree (user_id, product_id);

alter table "public"."access_logs" add constraint "access_logs_pkey" PRIMARY KEY using index "access_logs_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."favorites" add constraint "favorites_pkey" PRIMARY KEY using index "favorites_pkey";

alter table "public"."product_comments" add constraint "product_comments_pkey" PRIMARY KEY using index "product_comments_pkey";

alter table "public"."product_images" add constraint "product_images_pkey" PRIMARY KEY using index "product_images_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."provinces" add constraint "provinces_pkey" PRIMARY KEY using index "provinces_pkey";

alter table "public"."regencies" add constraint "regencies_pkey" PRIMARY KEY using index "regencies_pkey";

alter table "public"."reports" add constraint "reports_pkey" PRIMARY KEY using index "reports_pkey";

alter table "public"."view_history" add constraint "view_history_pkey" PRIMARY KEY using index "view_history_pkey";

alter table "public"."access_logs" add constraint "access_logs_regency_id_fkey" FOREIGN KEY (regency_id) REFERENCES regencies(regency_id) not valid;

alter table "public"."access_logs" validate constraint "access_logs_regency_id_fkey";

alter table "public"."access_logs" add constraint "access_logs_session_id_access_date_key" UNIQUE using index "access_logs_session_id_access_date_key";

alter table "public"."access_logs" add constraint "access_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."access_logs" validate constraint "access_logs_user_id_fkey";

alter table "public"."categories" add constraint "categories_name_key" UNIQUE using index "categories_name_key";

alter table "public"."favorites" add constraint "favorites_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_product_id_fkey";

alter table "public"."favorites" add constraint "favorites_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."favorites" validate constraint "favorites_user_id_fkey";

alter table "public"."favorites" add constraint "favorites_user_id_product_id_key" UNIQUE using index "favorites_user_id_product_id_key";

alter table "public"."product_comments" add constraint "comment_length" CHECK (((char_length(comment) >= 1) AND (char_length(comment) <= 1000))) not valid;

alter table "public"."product_comments" validate constraint "comment_length";

alter table "public"."product_comments" add constraint "product_comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES product_comments(id) ON DELETE CASCADE not valid;

alter table "public"."product_comments" validate constraint "product_comments_parent_id_fkey";

alter table "public"."product_comments" add constraint "product_comments_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."product_comments" validate constraint "product_comments_product_id_fkey";

alter table "public"."product_comments" add constraint "product_comments_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."product_comments" validate constraint "product_comments_rating_check";

alter table "public"."product_comments" add constraint "product_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."product_comments" validate constraint "product_comments_user_id_fkey";

alter table "public"."product_images" add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."product_images" validate constraint "product_images_product_id_fkey";

alter table "public"."products" add constraint "description_length" CHECK (((char_length(description) >= 10) AND (char_length(description) <= 2000))) not valid;

alter table "public"."products" validate constraint "description_length";

alter table "public"."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(category_id) not valid;

alter table "public"."products" validate constraint "products_category_id_fkey";

alter table "public"."products" add constraint "products_condition_check" CHECK (((condition)::text = ANY ((ARRAY['Baru'::character varying, 'Seperti Baru'::character varying, 'Sangat Bagus'::character varying, 'Bagus'::character varying, 'Cukup Bagus'::character varying])::text[]))) not valid;

alter table "public"."products" validate constraint "products_condition_check";

alter table "public"."products" add constraint "products_price_check" CHECK ((price >= 0)) not valid;

alter table "public"."products" validate constraint "products_price_check";

alter table "public"."products" add constraint "products_province_id_fkey" FOREIGN KEY (province_id) REFERENCES provinces(province_id) not valid;

alter table "public"."products" validate constraint "products_province_id_fkey";

alter table "public"."products" add constraint "products_regency_id_fkey" FOREIGN KEY (regency_id) REFERENCES regencies(regency_id) not valid;

alter table "public"."products" validate constraint "products_regency_id_fkey";

alter table "public"."products" add constraint "products_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'sold'::character varying, 'inactive'::character varying, 'deleted'::character varying, 'suspended'::character varying])::text[]))) not valid;

alter table "public"."products" validate constraint "products_status_check";

alter table "public"."products" add constraint "products_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."products" validate constraint "products_user_id_fkey";

alter table "public"."products" add constraint "title_length" CHECK (((char_length((title)::text) >= 5) AND (char_length((title)::text) <= 100))) not valid;

alter table "public"."products" validate constraint "title_length";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'moderator'::character varying])::text[]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."provinces" add constraint "provinces_province_name_key" UNIQUE using index "provinces_province_name_key";

alter table "public"."regencies" add constraint "regencies_province_id_fkey" FOREIGN KEY (province_id) REFERENCES provinces(province_id) ON DELETE CASCADE not valid;

alter table "public"."regencies" validate constraint "regencies_province_id_fkey";

alter table "public"."regencies" add constraint "regencies_province_id_regency_name_key" UNIQUE using index "regencies_province_id_regency_name_key";

alter table "public"."reports" add constraint "report_target_check" CHECK ((((report_type = 'product'::report_type) AND (reported_product_id IS NOT NULL) AND (reported_user_id IS NULL)) OR ((report_type = 'user'::report_type) AND (reported_user_id IS NOT NULL) AND (reported_product_id IS NULL)))) not valid;

alter table "public"."reports" validate constraint "report_target_check";

alter table "public"."reports" add constraint "reports_reported_product_id_fkey" FOREIGN KEY (reported_product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."reports" validate constraint "reports_reported_product_id_fkey";

alter table "public"."reports" add constraint "reports_reported_user_id_fkey" FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."reports" validate constraint "reports_reported_user_id_fkey";

alter table "public"."reports" add constraint "reports_reporter_id_fkey" FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."reports" validate constraint "reports_reporter_id_fkey";

alter table "public"."reports" add constraint "reports_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."reports" validate constraint "reports_resolved_by_fkey";

alter table "public"."view_history" add constraint "view_history_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."view_history" validate constraint "view_history_product_id_fkey";

alter table "public"."view_history" add constraint "view_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."view_history" validate constraint "view_history_user_id_fkey";

alter table "public"."view_history" add constraint "view_history_user_id_product_id_key" UNIQUE using index "view_history_user_id_product_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.archive_old_inactive_products()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE products
  SET status = 'deleted'
  WHERE status = 'inactive'
    AND updated_at < now() - INTERVAL '90 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_admin()
 RETURNS TABLE(user_id uuid, email text, full_name text, role text, is_admin boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::TEXT,
    p.full_name,
    p.role,
    (p.role = 'admin') as is_admin
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.id = auth.uid();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_access_logs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM access_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_view_history()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM view_history
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY viewed_at DESC) as rn
      FROM view_history
    ) t
    WHERE rn > 100
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.find_nearest_regency(lat numeric, lng numeric)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  nearest_regency_id INTEGER;
BEGIN
  SELECT regency_id INTO nearest_regency_id
  FROM regencies
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  ORDER BY (
    6371 * acos(
      cos(radians(lat)) *
      cos(radians(latitude)) *
      cos(radians(longitude) - radians(lng)) +
      sin(radians(lat)) *
      sin(radians(latitude))
    )
  ) ASC
  LIMIT 1;

  RETURN nearest_regency_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_admins()
 RETURNS TABLE(user_id uuid, email text, full_name text, role text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    u.email::TEXT,
    p.full_name,
    p.role,
    p.created_at
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.role = 'admin'
  ORDER BY p.created_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_comment_replies(comment_uuid uuid)
 RETURNS TABLE(id uuid, product_id uuid, user_id uuid, parent_id uuid, comment text, rating integer, created_at timestamp with time zone, updated_at timestamp with time zone, is_seller_reply boolean, user_name text, user_avatar text)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.product_id,
    c.user_id,
    c.parent_id,
    c.comment,
    c.rating,
    c.created_at,
    c.updated_at,
    c.is_seller_reply,
    COALESCE(p.full_name, p.username, 'Anonymous') as user_name,
    p.avatar_url as user_avatar
  FROM product_comments c
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.parent_id = comment_uuid
  ORDER BY c.created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_comment_stats(product_uuid uuid)
 RETURNS TABLE(comment_count bigint, average_rating numeric, rating_distribution jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as comment_count,
    ROUND(AVG(rating), 1) as average_rating,
    jsonb_object_agg(
      rating::TEXT,
      rating_count
    ) as rating_distribution
  FROM (
    SELECT
      rating,
      COUNT(*) as rating_count
    FROM product_comments
    WHERE product_id = product_uuid
      AND rating IS NOT NULL
      AND parent_id IS NULL
    GROUP BY rating
  ) rating_counts;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_comments_with_replies(product_uuid uuid)
 RETURNS TABLE(id uuid, product_id uuid, user_id uuid, parent_id uuid, comment text, rating integer, created_at timestamp with time zone, updated_at timestamp with time zone, is_seller_reply boolean, user_name text, user_avatar text, reply_count bigint)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.product_id,
    c.user_id,
    c.parent_id,
    c.comment,
    c.rating,
    c.created_at,
    c.updated_at,
    c.is_seller_reply,
    COALESCE(p.full_name, p.username, 'Anonymous') as user_name,
    p.avatar_url as user_avatar,
    (
      SELECT COUNT(*)
      FROM product_comments replies
      WHERE replies.parent_id = c.id
    )::BIGINT as reply_count
  FROM product_comments c
  LEFT JOIN profiles p ON c.user_id = p.id
  WHERE c.product_id = product_uuid
    AND c.parent_id IS NULL
  ORDER BY c.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_product_stats(user_uuid uuid)
 RETURNS TABLE(total_products bigint, active_products bigint, sold_products bigint, total_favorites bigint, average_rating numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status != 'deleted')::BIGINT as total_products,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_products,
    COUNT(*) FILTER (WHERE status = 'sold')::BIGINT as sold_products,
    (SELECT COUNT(*) FROM favorites WHERE favorites.user_id = user_uuid)::BIGINT as total_favorites,
    (
      SELECT ROUND(AVG(rating), 1)
      FROM product_comments c
      JOIN products p ON c.product_id = p.id
      WHERE p.user_id = user_uuid
        AND c.rating IS NOT NULL
        AND c.parent_id IS NULL
    ) as average_rating
  FROM products
  WHERE user_id = user_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 이미 존재하면 업데이트
    UPDATE public.profiles
    SET
      username = COALESCE(NEW.raw_user_meta_data->>'username', username),
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url)
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- 에러 로그 남기고 계속 진행
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.nearby_products(user_lat numeric, user_lng numeric, max_distance_km integer DEFAULT 50, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, title text, price bigint, distance_km numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.price,
    (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(p.latitude))
      )
    )::DECIMAL AS distance_km
  FROM products p
  WHERE
    p.status = 'active'
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) *
        cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) *
        sin(radians(p.latitude))
      )
    ) <= max_distance_km
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.products_by_regency(user_regency_id integer, limit_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, title text, price integer, description text, condition text, status text, user_id uuid, regency_id integer, category_id integer, latitude numeric, longitude numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.price,
    p.description,
    p.condition,
    p.status,
    p.user_id,
    p.regency_id,
    p.category_id,
    p.latitude,
    p.longitude,
    p.created_at
  FROM products p
  WHERE p.status = 'active'
    AND (
      p.regency_id = user_regency_id
      OR p.regency_id IN (
        SELECT r2.regency_id
        FROM regencies r1
        JOIN regencies r2 ON r1.province_id = r2.province_id
        WHERE r1.regency_id = user_regency_id
      )
    )
  ORDER BY
    CASE WHEN p.regency_id = user_regency_id THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.search_vector := to_tsvector('indonesian', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_products(search_query text, limit_count integer DEFAULT 50)
 RETURNS TABLE(id uuid, title text, description text, price integer, condition text, status text, latitude numeric, longitude numeric, regency_id integer, category_id integer, user_id uuid, created_at timestamp with time zone, rank real)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.price,
    p.condition,
    p.status,
    p.latitude,
    p.longitude,
    p.regency_id,
    p.category_id,
    p.user_id,
    p.created_at,
    ts_rank(p.search_vector, to_tsquery('indonesian', search_query)) as rank
  FROM products p
  WHERE p.search_vector @@ to_tsquery('indonesian', search_query)
    AND p.status = 'active'
  ORDER BY rank DESC, p.created_at DESC
  LIMIT limit_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_access_log_regency()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL AND NEW.regency_id IS NULL THEN
    NEW.regency_id := find_nearest_regency(NEW.latitude, NEW.longitude);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_product_location_from_regency()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (NEW.latitude IS NULL OR NEW.longitude IS NULL) AND NEW.regency_id IS NOT NULL THEN
    SELECT latitude, longitude
    INTO NEW.latitude, NEW.longitude
    FROM regencies
    WHERE regency_id = NEW.regency_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_product_comments_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_reports_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_view_history(p_user_id uuid, p_product_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO view_history (user_id, product_id, viewed_at)
  VALUES (p_user_id, p_product_id, now())
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET viewed_at = now();
END;
$function$
;

create policy "access_logs_insert_policy"
on "public"."access_logs"
as permissive
for insert
to public
with check (true);


create policy "access_logs_select_policy"
on "public"."access_logs"
as permissive
for select
to public
using (is_admin());


create policy "Users can delete own favorites"
on "public"."favorites"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own favorites"
on "public"."favorites"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view own favorites"
on "public"."favorites"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Anyone can view comments"
on "public"."product_comments"
as permissive
for select
to public
using (true);


create policy "Authenticated users can insert comments"
on "public"."product_comments"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Product owner can mark as seller reply"
on "public"."product_comments"
as permissive
for insert
to public
with check (
CASE
    WHEN (is_seller_reply = true) THEN (EXISTS ( SELECT 1
       FROM products p
      WHERE ((p.id = product_comments.product_id) AND (p.user_id = auth.uid()))))
    ELSE true
END);


create policy "Users can delete own comments"
on "public"."product_comments"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own comments"
on "public"."product_comments"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "product_comments_delete_own_policy"
on "public"."product_comments"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "product_comments_insert_policy"
on "public"."product_comments"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "product_comments_select_policy"
on "public"."product_comments"
as permissive
for select
to public
using (true);


create policy "product_comments_update_own_policy"
on "public"."product_comments"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


create policy "Product images are viewable by everyone"
on "public"."product_images"
as permissive
for select
to public
using (true);


create policy "Product owners can delete images"
on "public"."product_images"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM products
  WHERE ((products.id = product_images.product_id) AND (products.user_id = auth.uid())))));


create policy "Product owners can insert images"
on "public"."product_images"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM products
  WHERE ((products.id = product_images.product_id) AND (products.user_id = auth.uid())))));


create policy "Authenticated users can insert products"
on "public"."products"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Products are viewable by everyone"
on "public"."products"
as permissive
for select
to public
using (((status)::text = ANY ((ARRAY['active'::character varying, 'sold'::character varying])::text[])));


create policy "Users can delete own products"
on "public"."products"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own products"
on "public"."products"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "profiles_insert_own"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((id = auth.uid()));


create policy "profiles_select_policy"
on "public"."profiles"
as permissive
for select
to authenticated
using (((id = auth.uid()) OR is_admin()));


create policy "profiles_update_own"
on "public"."profiles"
as permissive
for update
to authenticated
using ((id = auth.uid()))
with check ((id = auth.uid()));


create policy "reports_admin_all_policy"
on "public"."reports"
as permissive
for all
to authenticated
using (is_admin());


create policy "reports_insert_policy"
on "public"."reports"
as permissive
for insert
to authenticated
with check ((auth.uid() = reporter_id));


create policy "reports_select_own_policy"
on "public"."reports"
as permissive
for select
to authenticated
using ((auth.uid() = reporter_id));


create policy "Users can delete own history"
on "public"."view_history"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert own history"
on "public"."view_history"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view own history"
on "public"."view_history"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER trigger_set_access_log_regency BEFORE INSERT ON public.access_logs FOR EACH ROW EXECUTE FUNCTION set_access_log_regency();

CREATE TRIGGER trigger_product_comments_updated_at BEFORE UPDATE ON public.product_comments FOR EACH ROW EXECUTE FUNCTION update_product_comments_updated_at();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.product_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_search_vector_trigger BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

CREATE TRIGGER trigger_set_product_location_insert BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION set_product_location_from_regency();

CREATE TRIGGER trigger_set_product_location_update BEFORE UPDATE ON public.products FOR EACH ROW WHEN ((new.regency_id IS DISTINCT FROM old.regency_id)) EXECUTE FUNCTION set_product_location_from_regency();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION update_reports_updated_at();


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "product_images_authenticated_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'product-images'::text));



  create policy "product_images_authenticated_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'product-images'::text))
with check ((bucket_id = 'product-images'::text));



  create policy "product_images_owner_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'product-images'::text) AND (auth.uid() = owner)));



  create policy "product_images_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'product-images'::text));



  create policy "profile_avatars_authenticated_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'profile-avatars'::text));



  create policy "profile_avatars_owner_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'profile-avatars'::text) AND (auth.uid() = owner)));



  create policy "profile_avatars_owner_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'profile-avatars'::text) AND (auth.uid() = owner)))
with check (((bucket_id = 'profile-avatars'::text) AND (auth.uid() = owner)));



  create policy "profile_avatars_public_read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profile-avatars'::text));



