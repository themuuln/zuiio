-- 7. Case-insensitive role name uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_org_lower_name_active
  ON public.roles (organization_id, lower(name))
  WHERE deleted_at IS NULL;

-- 8. Trigger: protect system roles from mutation
CREATE OR REPLACE FUNCTION public.prevent_system_role_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.is_system = TRUE THEN
    IF TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'Cannot rename system role "%" — system roles are immutable', OLD.name;
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.is_system IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'Cannot modify is_system flag on role "%"', OLD.name;
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      RAISE EXCEPTION 'Cannot delete system role "%"', OLD.name;
    END IF;
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Cannot delete system role "%"', OLD.name;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_system_role_mutation ON public.roles;
CREATE TRIGGER trg_prevent_system_role_mutation
  BEFORE UPDATE OR DELETE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_system_role_mutation();

-- 9. Trigger: prevent system role_permissions replacement
CREATE OR REPLACE FUNCTION public.prevent_system_role_perm_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_system BOOLEAN;
BEGIN
  SELECT is_system INTO v_is_system FROM public.roles WHERE id = OLD.role_id;
  IF v_is_system = TRUE THEN
    IF current_setting('role') NOT IN ('postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Cannot modify permissions on system role — system role permissions are immutable';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_system_role_perm_change ON public.role_permissions;
CREATE TRIGGER trg_prevent_system_role_perm_change
  BEFORE DELETE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_system_role_perm_change();

-- 10. Trigger: reject cross-org role_id on organization_users
CREATE OR REPLACE FUNCTION public.validate_membership_role_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_org UUID;
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    SELECT organization_id INTO v_role_org FROM public.roles WHERE id = NEW.role_id AND deleted_at IS NULL;
    IF v_role_org IS NULL THEN
      RAISE EXCEPTION 'Role % does not exist or is deleted', NEW.role_id;
    END IF;
    IF v_role_org != NEW.organization_id THEN
      RAISE EXCEPTION 'Role % belongs to a different organization', NEW.role_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_membership_role_org ON public.organization_users;
CREATE TRIGGER trg_validate_membership_role_org
  BEFORE INSERT OR UPDATE OF role_id ON public.organization_users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_membership_role_org();

-- 11. Trigger: reject cross-org role_permissions pair
CREATE OR REPLACE FUNCTION public.validate_role_permission_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role_org UUID;
  v_perm_org UUID;
BEGIN
  SELECT organization_id INTO v_role_org FROM public.roles WHERE id = NEW.role_id;
  SELECT organization_id INTO v_perm_org FROM public.permissions WHERE id = NEW.permission_id;
  IF v_role_org IS NULL OR v_perm_org IS NULL THEN
    RAISE EXCEPTION 'Role or permission does not exist';
  END IF;
  IF v_role_org != v_perm_org THEN
    RAISE EXCEPTION 'Role and permission belong to different organizations';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_role_permission_org ON public.role_permissions;
CREATE TRIGGER trg_validate_role_permission_org
  BEFORE INSERT ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_permission_org();

-- 12. Trigger: prevent deleting role with active members
CREATE OR REPLACE FUNCTION public.prevent_delete_role_with_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.organization_users
    WHERE role_id = OLD.id AND organization_id = OLD.organization_id AND removed_at IS NULL;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Cannot delete role: % member(s) are still assigned to it', v_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_role_with_members ON public.roles;
CREATE TRIGGER trg_prevent_delete_role_with_members
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delete_role_with_members();