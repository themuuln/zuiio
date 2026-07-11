-- Validate attribute options when value_type = 'select'
ALTER TABLE public.product_attribute_definitions
  ADD CONSTRAINT pad_select_options_check
  CHECK (
    value_type != 'select'
    OR (options IS NOT NULL AND jsonb_array_length(options) > 0)
  );
