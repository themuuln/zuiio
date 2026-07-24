import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Re-export from useCoOwners for backward compatibility
export { useInviteCoOwner, useUpdateCoOwnerRole, useRevokeCoOwner } from "./useCoOwners";
