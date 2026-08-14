-- Add sort_order column to work_order_helpers for mechanic reordering.
-- Existing rows get sequential sort_order based on their creation time.

alter table work_order_helpers
  add column sort_order integer not null default 0;

-- Assign initial sort_order for existing rows (grouped by work order, ordered by assigned_at)
with ordered as (
  select
    id,
    row_number() over (
      partition by work_order_id
      order by assigned_at asc, id asc
    ) - 1 as seq
  from work_order_helpers
)
update work_order_helpers
  set sort_order = ordered.seq
  from ordered
  where work_order_helpers.id = ordered.id;