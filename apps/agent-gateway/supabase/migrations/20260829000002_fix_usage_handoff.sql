-- Keep funnel assignment lookups efficient while scoping them by experiment.
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_assigned_at
  ON public.experiment_assignments (assigned_at);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment_assigned_at
  ON public.experiment_assignments (experiment_id, assigned_at);
