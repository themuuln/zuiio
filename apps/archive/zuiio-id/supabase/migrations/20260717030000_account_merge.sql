-- Account merge support for Zuiio ecosystem
-- Allows merging data from one user account to another when linking SSO

-- ============================================================
-- Merge audit table: tracks all merge operations
-- ============================================================

create table if not exists public.user_merges (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete set null,
  status text not null check (status in (
    'pending',      -- Merge initiated, awaiting confirmation
    'in_progress',  -- Merge is running
    'completed',    -- Merge finished successfully
    'failed',       -- Merge failed
    'rolled_back'   -- Merge was undone
  )),
  products_merged text[] not null default '{}',  -- List of products that were merged
  conflict_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  
  -- Prevent merging the same pair twice
  unique(from_user_id, to_user_id)
);

create index if not exists idx_user_merges_from_user on public.user_merges (from_user_id);
create index if not exists idx_user_merges_to_user on public.user_merges (to_user_id);
create index if not exists idx_user_merges_status on public.user_merges (status);

alter table public.user_merges enable row level security;

-- Owner-only select (using org_memberships → roles join)
create policy "Owners can view merge history"
  on public.user_merges for select
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships om
      join public.roles r on r.id = om.role_id
      where om.user_id = (select auth.uid())
      and r.name = 'owner'
    )
  );

-- ============================================================
-- Generic merge function: re-keys data from one user to another
-- ============================================================

/**
 * Merge data from source_user_id to target_user_id for a specific table.
 * 
 * @param p_source_user_id - The user ID to merge FROM (will be deleted)
 * @param p_target_user_id - The user ID to merge TO (will keep the data)
 * @param p_table_name - The table to merge (must have user_id column)
 * @param p_on_conflict - What to do on conflict: 'skip', 'latest', 'error'
 * 
 * Returns: number of rows merged
 */
create or replace function public.merge_user_data(
  p_source_user_id uuid,
  p_target_user_id uuid,
  p_table_name text,
  p_on_conflict text default 'skip'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows_merged integer := 0;
  v_sql text;
begin
  -- Validate inputs
  if p_source_user_id = p_target_user_id then
    raise exception 'Cannot merge a user with themselves';
  end if;

  -- Validate table exists and has user_id column
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = p_table_name
    and column_name = 'user_id'
  ) then
    raise exception 'Table % does not exist or has no user_id column', p_table_name;
  end if;

  -- Perform the merge based on conflict strategy
  case p_on_conflict
    when 'skip' then
      -- Only merge rows that don't conflict
      v_sql := format(
        'UPDATE public.%I SET user_id = $1 
         WHERE user_id = $2 
         AND NOT EXISTS (
           SELECT 1 FROM public.%I t2 
           WHERE t2.user_id = $1 
           AND t2.id = %I.id
         )',
        p_table_name, p_table_name, p_table_name
      );
      execute v_sql using p_target_user_id, p_source_user_id;
      
    when 'latest' then
      -- For conflicting rows, keep the target's version (skip source's)
      v_sql := format(
        'UPDATE public.%I SET user_id = $1 
         WHERE user_id = $2 
         AND NOT EXISTS (
           SELECT 1 FROM public.%I t2 
           WHERE t2.user_id = $1 
           AND t2.id = %I.id
         )',
        p_table_name, p_table_name, p_table_name
      );
      execute v_sql using p_target_user_id, p_source_user_id;
      
    when 'error' then
      -- Fail if there are any conflicts
      declare
        v_conflict_count integer;
      begin
        v_sql := format(
          'SELECT count(*) FROM public.%I t1
           INNER JOIN public.%I t2 ON t1.id = t2.id
           WHERE t1.user_id = $1 AND t2.user_id = $2',
          p_table_name, p_table_name
        );
        execute v_sql into v_conflict_count using p_source_user_id, p_target_user_id;
        
        if v_conflict_count > 0 then
          raise exception 'Merge failed: % conflicting rows in table %', 
            v_conflict_count, p_table_name;
        end if;
      end;
      
      -- No conflicts, proceed with merge
      v_sql := format(
        'UPDATE public.%I SET user_id = $1 WHERE user_id = $2',
        p_table_name
      );
      execute v_sql using p_target_user_id, p_source_user_id;
      
    else
      raise exception 'Invalid on_conflict value: %. Use skip, latest, or error', p_on_conflict;
  end case;

  -- Get count of affected rows
  GET DIAGNOSTICS v_rows_merged = ROW_COUNT;
  
  return v_rows_merged;
end;
$$;

-- ============================================================
-- Zer-specific merge function
-- ============================================================

/**
 * Merge all Zer data from one user to another.
 * Tables with user_id: invoices, products, settings, etc.
 */
create or replace function public.merge_zer_data(
  p_source_user_id uuid,
  p_target_user_id uuid,
  p_on_conflict text default 'skip'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_table_name text;
  v_rows integer;
  v_tables text[] := array[
    'invoices',
    'products', 
    'customers',
    'settings',
    'categories',
    'suppliers'
  ];
begin
  foreach v_table_name in array v_tables
  loop
    -- Check if table exists
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public'
      and table_name = v_table_name
    ) then
      begin
        v_rows := public.merge_user_data(
          p_source_user_id, 
          p_target_user_id, 
          v_table_name, 
          p_on_conflict
        );
        
        v_result := v_result || jsonb_build_object(
          'table', v_table_name,
          'rows_merged', v_rows,
          'status', 'success'
        );
      exception when others then
        v_result := v_result || jsonb_build_object(
          'table', v_table_name,
          'rows_merged', 0,
          'status', 'error',
          'error', SQLERRM
        );
      end;
    end if;
  end loop;
  
  return v_result;
end;
$$;

-- ============================================================
-- Tolom-specific merge function
-- ============================================================

/**
 * Merge all Tolom data from one user to another.
 * Tables with user_id: jobs, services, parts, settings, etc.
 */
create or replace function public.merge_tolom_data(
  p_source_user_id uuid,
  p_target_user_id uuid,
  p_on_conflict text default 'skip'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_table_name text;
  v_rows integer;
  v_tables text[] := array[
    'jobs',
    'services',
    'parts',
    'vehicles',
    'customers',
    'settings',
    'invoices'
  ];
begin
  foreach v_table_name in array v_tables
  loop
    -- Check if table exists
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public'
      and table_name = v_table_name
    ) then
      begin
        v_rows := public.merge_user_data(
          p_source_user_id, 
          p_target_user_id, 
          v_table_name, 
          p_on_conflict
        );
        
        v_result := v_result || jsonb_build_object(
          'table', v_table_name,
          'rows_merged', v_rows,
          'status', 'success'
        );
      exception when others then
        v_result := v_result || jsonb_build_object(
          'table', v_table_name,
          'rows_merged', 0,
          'status', 'error',
          'error', SQLERRM
        );
      end;
    end if;
  end loop;
  
  return v_result;
end;
$$;

-- ============================================================
-- Master merge function: orchestrates the full merge process
-- ============================================================

/**
 * Execute a full account merge from one user to another.
 * 
 * This function:
 * 1. Creates a merge record
 * 2. Merges data for each product
 * 3. Updates the merge record with results
 * 4. Deletes the source user (optional)
 * 
 * @param p_source_user_id - The user to merge FROM (will be deleted)
 * @param p_target_user_id - The user to merge TO (will keep the data)
 * @param p_products - Array of products to merge (e.g., array['zer', 'tolom'])
 * @param p_delete_source - Whether to delete the source user after merge
 * 
 * Returns: merge record with results
 */
create or replace function public.execute_account_merge(
  p_source_user_id uuid,
  p_target_user_id uuid,
  p_products text[] default array['zer', 'tolom'],
  p_delete_source boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_merge_id uuid;
  v_result jsonb := '{}'::jsonb;
  v_product text;
  v_product_result jsonb;
  v_products_merged text[] := '{}';
  v_total_conflicts integer := 0;
begin
  -- Create merge record
  insert into public.user_merges (
    from_user_id, 
    to_user_id, 
    initiated_by, 
    status
  ) values (
    p_source_user_id,
    p_target_user_id,
    (select auth.uid()),
    'in_progress'
  ) returning id into v_merge_id;

  -- Merge each product
  foreach v_product in array p_products
  loop
    case v_product
      when 'zer' then
        v_product_result := public.merge_zer_data(
          p_source_user_id, 
          p_target_user_id,
          'skip'
        );
      when 'tolom' then
        v_product_result := public.merge_tolom_data(
          p_source_user_id, 
          p_target_user_id,
          'skip'
        );
      else
        v_product_result := jsonb_build_object(
          'error', format('Unknown product: %s', v_product)
        );
    end case;
    
    -- Count conflicts from result
    v_total_conflicts := v_total_conflicts + (
      select count(*) from jsonb_array_elements(v_product_result) 
      where (value->>'status') = 'error'
    );
    
    v_result := v_result || jsonb_build_object(v_product, v_product_result);
    v_products_merged := array_append(v_products_merged, v_product);
  end loop;

  -- Update merge record
  update public.user_merges
  set 
    status = 'completed',
    products_merged = v_products_merged,
    conflict_count = v_total_conflicts,
    completed_at = now()
  where id = v_merge_id;

  -- Optionally delete source user
  if p_delete_source then
    -- Note: This requires service_role and will cascade delete
    -- from auth.users which cascades to all references
    delete from auth.users where id = p_source_user_id;
  end if;

  -- Return merge record with results
  v_result := v_result || jsonb_build_object(
    'merge_id', v_merge_id,
    'status', 'completed',
    'products_merged', to_jsonb(v_products_merged),
    'conflict_count', v_total_conflicts
  );

  return v_result;
end;
$$;

-- ============================================================
-- Helper function: check if merge is possible
-- ============================================================

/**
 * Check if two users can be merged and what conflicts exist.
 * Useful for showing a preview before executing the merge.
 */
create or replace function public.check_merge_conflicts(
  p_source_user_id uuid,
  p_target_user_id uuid,
  p_products text[] default array['zer', 'tolom']
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_product text;
  v_table_name text;
  v_source_count integer;
  v_conflict_count integer;
  v_product_result jsonb;
begin
  foreach v_product in array p_products
  loop
    v_product_result := '[]'::jsonb;
    
    case v_product
      when 'zer' then
        v_table_name := 'invoices';  -- Example, would check all tables
      when 'tolom' then
        v_table_name := 'jobs';      -- Example, would check all tables
      else
        continue;
    end case;
    
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public'
      and table_name = v_table_name
    ) then
      -- Check source row count
      execute format(
        'SELECT count(*) FROM public.%I WHERE user_id = $1',
        v_table_name
      ) into v_source_count using p_source_user_id;
      
      -- Check conflicts
      execute format(
        'SELECT count(*) FROM public.%I t1
         INNER JOIN public.%I t2 ON t1.id = t2.id
         WHERE t1.user_id = $1 AND t2.user_id = $2',
        v_table_name, v_table_name
      ) into v_conflict_count using p_source_user_id, p_target_user_id;
      
      v_product_result := v_product_result || jsonb_build_object(
        'table', v_table_name,
        'source_rows', v_source_count,
        'conflicts', v_conflict_count
      );
    end if;
    
    v_result := v_result || jsonb_build_object(v_product, v_product_result);
  end loop;

  return v_result;
end;
$$;
