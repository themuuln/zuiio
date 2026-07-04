// Auto-generated Supabase database types.
// Generated from live database schema via PostgREST OpenAPI spec.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      "catalog_variant_groups": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "name_mn": string;
        "applies_to": string;
        "sort_order": number;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "car_brands": {
        Row: {
        "id": string;
        "name": string;
        "country": string;
        "logo_url": string;
        "is_active": boolean;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "payments": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "work_order_id": string;
        "amount": number;
        "payment_method": string;
        "reference": string;
        "notes": string;
        "paid_at": string;
        "created_by": string;
        "created_at": string;
        "deleted_at": string;
        "cash_register_session_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_order_status_history": {
        Row: {
        "id": string;
        "work_order_id": string;
        "organization_id": string;
        "previous_status": string;
        "status": string;
        "created_by": string;
        "notes": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "purchase_order_items": {
        Row: {
        "id": string;
        "organization_id": string;
        "purchase_order_id": string;
        "part_id": string;
        "quantity_ordered": number;
        "quantity_received": number;
        "unit_cost": number;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "cash_register_entries": {
        Row: {
        "id": string;
        "session_id": string;
        "organization_id": string;
        "entry_type": string;
        "amount": number;
        "source": string;
        "source_id": string;
        "description": string;
        "created_by": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "price_rules": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "description": string;
        "apply_to": string;
        "conditions": string;
        "conditions_description": string;
        "operator": string;
        "value": number;
        "priority": number;
        "part_category": string;
        "service_category": string;
        "part_name_pattern": string;
        "service_name_pattern": string;
        "is_active": boolean;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "parts_car_parts": {
        Row: {
        "id": string;
        "organization_id": string;
        "parts_car_id": string;
        "part_id": string;
        "name": string;
        "location_group": "engine" | "transmission" | "suspension" | "brake" | "body" | "interior" | "electrical" | "cooling" | "exhaust" | "fuel" | "steering" | "ac" | "other";
        "quantity": number;
        "condition": string;
        "estimated_price": number;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "reminder_logs": {
        Row: {
        "id": string;
        "organization_id": string;
        "vehicle_service_schedule_id": string;
        "vehicle_id": string;
        "customer_id": string;
        "service_catalog_id": string;
        "service_name": string;
        "reminder_type": string;
        "channel": string;
        "status": string;
        "scheduled_at": string;
        "sent_at": string;
        "error_message": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "customer_communications": {
        Row: {
        "id": string;
        "organization_id": string;
        "customer_id": string;
        "type": string;
        "direction": string;
        "subject": string | null;
        "content": string;
        "staff_id": string | null;
        "created_at": string;
        "deleted_at": string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "service_recommendations": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "work_order_id": string;
        "work_order_service_id": string;
        "service_name": string;
        "service_catalog_id": string;
        "recommended_interval_months": number;
        "recommended_interval_km": number;
        "next_due_date": string;
        "next_due_km": number;
        "priority": string;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "role_permissions": {
        Row: {
        "role_id": string;
        "permission_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "part_price_history": {
        Row: {
        "id": string;
        "organization_id": string;
        "part_name": string;
        "part_number": string;
        "vehicle_make": string;
        "vehicle_model": string;
        "quantity": number;
        "unit_price": number;
        "final_price": number;
        "work_order_id": string;
        "mechanic_id": string;
        "created_by": string;
        "created_at": string;
        "discount_amount": number;
        "discount_percentage": number;
        "vehicle_id": string;
        "work_order_part_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "vehicles": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "customer_id": string;
        "plate_number": string;
        "make": string;
        "model": string;
        "year": number;
        "vin": string;
        "color": string;
        "odometer": number;
        "engine": string;
        "fuel_type": string;
        "transmission": string;
        "trim": string;
        "drivetrain": string;
        "body_type": string;
        "license_expiry": string;
        "inspection_notes": string;
        "last_visit_date": string;
        "next_service_date": string;
        "notes": string;
        "tags": string[];
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "last_visit_at": string;
        "type": string;
        "total_visits": number;
        "chassis_number": string;
        "license_expiry_at": string;
        "next_service_at": string;
        "last_service_branch_id": string;
        "import_date": string;
        "country_of_origin": string;
        "category": string;
        "seats": number;
        "steering": string;
        "height": number;
        "width": number;
        "length": number;
        "weight": number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "part_categories": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "created_by": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "invoice_refunds": {
        Row: {
        "id": string;
        "invoice_id": string;
        "organization_id": string;
        "amount": number;
        "method": string;
        "status": "pending" | "completed" | "failed" | "cancelled";
        "reason": string | null;
        "reference": string | null;
        "notes": string | null;
        "refunded_at": string;
        "created_by": string | null;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_order_services": {
        Row: {
        "id": string;
        "work_order_id": string;
        "service_catalog_id": string | null;
        "service_name": string;
        "description": string | null;
        "unit_price": number;
        "discount_amount": number;
        "discount_percentage": number;
        "quantity": number;
        "final_price": number;
        "notes": string | null;
        "created_by": string | null;
        "created_at": string;
        "organization_id": string | null;
        "mechanic_id": string | null;
        "last_sold_price": number | null;
        "unit_cost": number;
        "catalog_item_variant_id": string | null;
        "variant_label": string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "customers": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "first_name": string;
        "last_name": string;
        "phone": string;
        "email": string;
        "address": string;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "type": string;
        "full_name": string;
        "total_visits": number;
        "company_name": string;
        "contact_person": string;
        "last_visit_at": string;
        "tags": string[];
        "source": string;
        "portal_token": string;
        "customer_user_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "vehicle_owners": {
        Row: {
        "vehicle_id": string;
        "customer_id": string;
        "is_primary": boolean;
        "organization_id": string;
        "owned_from": string;
        "created_at": string;
        "id": string;
        "owned_until": string;
        "created_by": string;
        "updated_by": string;
        "updated_at": string;
        "deleted_at": string;
        "branch_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "feature_flags": {
        Row: {
        "id": string;
        "organization_id": string;
        "flag_key": string;
        "enabled": boolean;
        "description": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "service_price_history": {
        Row: {
        "id": string;
        "organization_id": string;
        "service_catalog_id": string;
        "vehicle_make": string;
        "vehicle_model": string;
        "unit_price": number;
        "discount_amount": number;
        "discount_percentage": number;
        "quantity": number;
        "final_price": number;
        "work_order_id": string;
        "mechanic_id": string;
        "created_by": string;
        "created_at": string;
        "service_name": string;
        "vehicle_id": string;
        "work_order_service_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "expense_categories": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "description": string;
        "color": string;
        "icon": string;
        "sort_order": number;
        "is_active": boolean;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "catalog_variant_options": {
        Row: {
        "id": string;
        "organization_id": string;
        "group_id": string;
        "label": string;
        "label_mn": string;
        "sort_order": number;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "global_parts_vehicle_models": {
        Row: {
        "id": string;
        "global_part_id": string;
        "vehicle_model_id": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "profiles": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "full_name": string;
        "phone": string;
        "avatar_url": string;
        "is_active": boolean;
        "created_at": string;
        "updated_at": string;
        "username": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "parts_cars": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "make": string;
        "model": string;
        "year": number;
        "vin": string;
        "license_plate": string;
        "purchase_cost": number;
        "currency": string;
        "arrival_date": string;
        "status": string;
        "total_parts_actual": number;
        "total_estimated_value": number;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "organization_users": {
        Row: {
        "organization_id": string;
        "user_id": string;
        "role_id": string;
        "branch_id": string;
        "is_primary": boolean;
        "joined_at": string;
        "is_default": boolean;
        "removed_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "invoice_items": {
        Row: {
        "id": string;
        "invoice_id": string;
        "item_type": string;
        "description": string;
        "quantity": number;
        "unit_price": number;
        "discount_amount": number;
        "total_price": number;
        "sort_order": number;
        "created_at": string;
        "is_tax_exempt": boolean;
        "tax_rate": number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_orders": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "customer_id": string;
        "vehicle_id": string;
        "bay_number": number;
        "status": string;
        "description": string;
        "notes": string;
        "mechanic_id": string;
        "started_at": string;
        "completed_at": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "subtotal": number;
        "discount_total": number;
        "total": number;
        "complaint": string;
        "diagnosis": string;
        "mechanic_notes": string;
        "discount_amount": number;
        "discount_percentage": number;
        "queue_order": number;
        "odometer_at_service": number;
        "diagnosis_label_id": string;
        "loss_reason": string;
        "source_estimate_id": string;
        "nuat_enabled": boolean;
        "labor_hours": number;
        "labor_cost": number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "organization_settings": {
        Row: {
        "organization_id": string;
        "invoice_prefix": string;
        "default_currency": string;
        "default_tax_rate": number;
        "timezone": string;
        "date_format": string;
        "settings": string;
        "created_at": string;
        "updated_at": string;
        "notification_email": string;
        "nuat_enabled": boolean;
        "ndsh_enabled": boolean;
        "ndsh_employer_rate": number;
        "ndsh_employee_rate": number;
        "einvoice_enabled": boolean;
        "einvoice_api_key": string;
        "einvoice_merchant_id": string;
        "einvoice_endpoint": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "app_config": {
        Row: {
        "key": string;
        "value": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "mechanic_commission_rules": {
        Row: {
        "id": string;
        "organization_id": string;
        "mechanic_id": string;
        "name": string;
        "commission_type": string;
        "commission_value": number;
        "min_commission": number;
        "max_commission": number;
        "is_active": boolean;
        "priority": number;
        "created_at": string;
        "updated_at": string;
        "created_by": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "mechanic_assignments": {
        Row: {
        "id": string;
        "work_order_id": string;
        "organization_id": string;
        "mechanic_id": string;
        "assigned_by": string;
        "assigned_at": string;
        "unassigned_at": string;
        "notes": string;
        "created_by": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "parts_catalog": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "part_number": string;
        "category": string;
        "description": string;
        "unit": string;
        "default_price": number;
        "is_active": boolean;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "name_mn": string;
        "purchase_price": number;
        "last_purchase_price": number;
        "global_part_id": string;
        "image_url": string;
        "location": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "inventory_movements": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "part_id": string;
        "movement_type": "purchase" | "sale" | "adjustment" | "transfer_in" | "transfer_out" | "return" | "waste" | "disassembly";
        "quantity": number;
        "unit_cost": number;
        "unit_price": number;
        "reference_type": string;
        "reference_id": string;
        "notes": string;
        "created_by": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "appointments": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "customer_id": string;
        "vehicle_id": string;
        "mechanic_id": string;
        "title": string;
        "description": string;
        "scheduled_at": string;
        "end_at": string;
        "status": string;
        "notes": string;
        "source_estimate_id": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "global_parts_catalog": {
        Row: {
        "id": string;
        "name": string;
        "name_mn": string;
        "part_number": string;
        "category": string;
        "description": string;
        "unit": string;
        "is_active": boolean;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_order_attachments": {
        Row: {
        "id": string;
        "organization_id": string;
        "work_order_id": string;
        "file_name": string;
        "file_size": number;
        "mime_type": string;
        "storage_path": string;
        "public_url": string;
        "file_type": string;
        "uploaded_by": string;
        "created_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_order_commissions": {
        Row: {
        "id": string;
        "work_order_id": string;
        "mechanic_id": string;
        "commission_rule_id": string;
        "commission_type": string;
        "commission_rate": number;
        "commission_amount": number;
        "labor_amount": number;
        "parts_amount": number;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "branches": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "address": string;
        "phone": string;
        "email": string;
        "is_main": boolean;
        "settings": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "total_visits": number;
        "is_active": boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "org_invites": {
        Row: {
        "id": string;
        "organization_id": string;
        "email": string;
        "role_id": string;
        "token": string;
        "status": string;
        "invited_by": string;
        "message": string;
        "expires_at": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "subscription_plans": {
        Row: {
        "id": string;
        "organization_id": string;
        "plan_type": "starter" | "pro" | "business" | "enterprise";
        "status": string;
        "started_at": string;
        "expires_at": string;
        "settings": string;
        "created_at": string;
        "updated_at": string;
        "grace_period_end": string;
        "auto_renew": boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "super_admins": {
        Row: {
        "id": string;
        "user_id": string;
        "created_at": string;
        "role": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "clock_in_tokens": {
        Row: {
        "id": string;
        "organization_id": string;
        "mechanic_id": string;
        "session_id": string;
        "token_hash": string;
        "action_type": string;
        "expires_at": string;
        "claimed_at": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "suppliers": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string | null;
        "name": string;
        "contact_person": string | null;
        "phone": string | null;
        "email": string | null;
        "address": string | null;
        "tax_id": string | null;
        "payment_terms": string | null;
        "notes": string | null;
        "is_active": boolean;
        "created_by": string | null;
        "updated_by": string | null;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "seller_assignments": {
        Row: {
        "id": string;
        "seller_id": string;
        "organization_id": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "customer_notes": {
        Row: {
        "id": string;
        "organization_id": string;
        "customer_id": string;
        "content": string;
        "type": string;
        "created_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "day_close_logs": {
        Row: {
        "id": string;
        "organization_id": string;
        "closed_by": string;
        "closed_at": string;
        "date": string;
        "summary": string;
        "created_at": string;
        "created_by": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "permissions": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "resource": string;
        "action": "create" | "read" | "update" | "delete" | "manage" | "write" | "invite";
        "description": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "marketing_campaigns": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "type": string;
        "status": string;
        "target_count": number;
        "sent_count": number;
        "opened_count": number;
        "clicked_count": number;
        "created_by": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "payroll_records": {
        Row: {
        "id": string;
        "organization_id": string;
        "mechanic_id": string;
        "period_start": string;
        "period_end": string;
        "total_hours": number;
        "hourly_rate": number;
        "gross_pay": number;
        "status": string;
        "paid_at": string;
        "notes": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "inventory_balances": {
        Row: {
        "organization_id": string;
        "branch_id": string;
        "part_id": string;
        "part_name": string;
        "part_number": string;
        "category": string;
        "unit": string;
        "default_price": number;
        "quantity_on_hand": number;
        "last_movement_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "stock_transfers": {
        Row: {
        "id": string;
        "organization_id": string;
        "from_branch_id": string;
        "to_branch_id": string;
        "status": string;
        "notes": string;
        "created_by": string;
        "approved_by": string;
        "received_by": string;
        "created_at": string;
        "completed_at": string;
        "cancelled_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "mechanic_daily_reports": {
        Row: {
        "id": string;
        "organization_id": string;
        "mechanic_id": string;
        "report_date": string;
        "work_orders_completed": number;
        "services_performed": number;
        "parts_used": number;
        "total_revenue": number;
        "total_discounts": number;
        "hours_worked": number;
        "notes": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "mechanic_devices": {
        Row: {
        "id": string;
        "mechanic_id": string;
        "organization_id": string;
        "device_name": string;
        "device_fingerprint": string;
        "last_used_at": string;
        "created_at": string;
        "revoked_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "branch_user_permissions": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "user_id": string;
        "can_view": boolean;
        "can_manage_users": boolean;
        "can_view_other_branches": boolean;
        "can_approve_transfers": boolean;
        "can_override_discounts": boolean;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "cash_register_sessions": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "date": string;
        "status": string;
        "opened_at": string;
        "closed_at": string;
        "opening_balance": number;
        "closing_balance": number;
        "expected_balance": number;
        "cash_in": number;
        "cash_out": number;
        "discrepancy": number;
        "discrepancy_note": string;
        "opened_by": string;
        "closed_by": string;
        "created_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "vehicle_model_services": {
        Row: {
        "id": string;
        "organization_id": string;
        "vehicle_model_id": string;
        "service_catalog_id": string;
        "specific_price": number;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_order_notes": {
        Row: {
        "id": string;
        "organization_id": string;
        "work_order_id": string;
        "content": string;
        "created_by": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "vehicle_model_parts": {
        Row: {
        "id": string;
        "organization_id": string;
        "vehicle_model_id": string;
        "part_id": string;
        "specific_price": number;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "invoices": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "work_order_id": string;
        "customer_id": string;
        "vehicle_id": string;
        "invoice_number": string;
        "status": "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled" | "refunded";
        "subtotal": number;
        "discount_total": number;
        "tax_total": number;
        "total": number;
        "amount_paid": number;
        "balance_due": number;
        "issued_at": string;
        "due_at": string;
        "paid_at": string;
        "customer_name": string;
        "customer_phone": string;
        "customer_email": string;
        "customer_address": string;
        "vehicle_plate": string;
        "vehicle_details": string;
        "public_token": string;
        "email_sent_at": string;
        "notes": string;
        "terms": string;
        "footer": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "amount_refunded": number;
        "einvoice_registration_id": string;
        "einvoice_qr_code": string;
        "einvoice_status": string;
        "einvoice_registered_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "estimate_items": {
        Row: {
        "id": string;
        "estimate_id": string;
        "organization_id": string;
        "item_type": string;
        "source_service_id": string;
        "source_part_id": string;
        "description": string;
        "quantity": number;
        "unit_price": number;
        "unit_cost": number;
        "discount_amount": number;
        "discount_percentage": number;
        "line_total": number;
        "sort_order": number;
        "notes": string;
        "created_by": string;
        "created_at": string;
        "is_tax_exempt": boolean;
        "tax_rate": number;
        "catalog_item_variant_id": string;
        "variant_label": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "mechanic_time_logs": {
        Row: {
        "id": string;
        "organization_id": string;
        "mechanic_id": string;
        "clock_in": string;
        "clock_out": string;
        "date": string;
        "notes": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "estimates": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "customer_id": string;
        "vehicle_id": string;
        "estimate_number": string;
        "status": string;
        "valid_until": string;
        "notes": string;
        "terms": string;
        "subtotal": number;
        "discount_amount": number;
        "discount_percentage": number;
        "discount_total": number;
        "tax_total": number;
        "grand_total": number;
        "converted_work_order_id": string;
        "appointment_id": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "organizations": {
        Row: {
        "id": string;
        "name": string;
        "slug": string;
        "logo_url": string;
        "settings": string;
        "is_active": boolean;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "branch_limit": number;
        "sharing_enabled": boolean;
        "booking_token": string;
        "tax_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "service_catalog": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "description": string;
        "default_price": number;
        "category": string;
        "is_active": boolean;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "branch_id": string;
        "estimated_duration_minutes": number;
        "interval_months": number;
        "interval_km": number;
        "global_service_id": string;
        "name_mn": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "service_completion_data": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "work_order_id": string;
        "vehicle_id": string;
        "odometer_reading": number;
        "customer_satisfaction": number;
        "customer_feedback": string;
        "customer_preferences": string;
        "next_appointment_date": string;
        "collected_at": string;
        "created_by": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "store_credit_balances": {
        Row: {
        "id": string;
        "customer_id": string;
        "organization_id": string;
        "balance": number;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "vehicle_service_schedules": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "vehicle_id": string;
        "service_catalog_id": string;
        "service_name": string;
        "interval_months": number;
        "interval_km": number;
        "last_service_date": string;
        "last_service_odometer": number;
        "next_due_date": string;
        "next_due_km": number;
        "reminder_enabled": boolean;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "contact_status": string;
        "contacted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "telegram_links": {
        Row: {
        "id": string;
        "organization_id": string;
        "user_id": string;
        "telegram_chat_id": number;
        "telegram_user_id": number;
        "telegram_username": string;
        "first_name": string;
        "last_name": string;
        "notification_preferences": string;
        "is_active": boolean;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "stock_thresholds": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "part_id": string;
        "minimum_quantity": number;
        "maximum_quantity": number;
        "notes": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "catalog_item_variants": {
        Row: {
        "id": string;
        "organization_id": string;
        "entity_type": string;
        "entity_id": string;
        "variant_label": string;
        "variant_data": string;
        "price": number;
        "cost": number;
        "sku": string;
        "barcode": string;
        "is_active": boolean;
        "sort_order": number;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_order_parts": {
        Row: {
        "id": string;
        "work_order_id": string;
        "part_name": string;
        "part_number": string | null;
        "quantity": number;
        "unit_price": number;
        "final_price": number;
        "notes": string | null;
        "created_by": string | null;
        "created_at": string;
        "organization_id": string | null;
        "discount_amount": number;
        "discount_percentage": number;
        "last_sold_price": number | null;
        "part_id": string | null;
        "unit_cost": number;
        "catalog_item_variant_id": string | null;
        "variant_label": string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "global_services_catalog": {
        Row: {
        "id": string;
        "name": string;
        "name_mn": string;
        "category": string;
        "description": string;
        "estimated_duration_minutes": number;
        "interval_months": number;
        "interval_km": number;
        "is_active": boolean;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "expenses": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "category_id": string;
        "vendor_name": string;
        "description": string;
        "amount": number;
        "tax_amount": number;
        "expense_date": string;
        "due_date": string;
        "paid_at": string;
        "payment_method": string;
        "reference_number": string;
        "receipt_url": string;
        "notes": string;
        "is_recurring": boolean;
        "recurrence_interval": string;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "diagnosis_labels": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "name_mn": string | null;
        "color": string | null;
        "sort_order": number;
        "is_active": boolean;
        "created_at": string;
        "updated_at": string;
        "created_by": string | null;
        "deleted_at": string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "mechanic_pay_rates": {
        Row: {
        "id": string;
        "organization_id": string;
        "mechanic_id": string;
        "hourly_rate": number;
        "effective_from": string;
        "effective_to": string;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "store_credit_transactions": {
        Row: {
        "id": string;
        "customer_id": string;
        "organization_id": string;
        "amount": number;
        "type": string;
        "reference_id": string;
        "reference_type": string;
        "notes": string;
        "created_by": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "roles": {
        Row: {
        "id": string;
        "organization_id": string;
        "name": string;
        "description": string;
        "is_system": boolean;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "stock_transfer_items": {
        Row: {
        "id": string;
        "transfer_id": string;
        "part_id": string;
        "quantity": number;
        "unit_cost": number;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "invoice_payments": {
        Row: {
        "id": string;
        "invoice_id": string;
        "amount": number;
        "method": string;
        "reference": string;
        "notes": string;
        "paid_at": string;
        "created_by": string;
        "created_at": string;
        "organization_id": string;
        "cash_register_session_id": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "telegram_link_tokens": {
        Row: {
        "id": string;
        "organization_id": string;
        "user_id": string;
        "token_hash": string;
        "expires_at": string;
        "used_at": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "car_models": {
        Row: {
        "id": string;
        "brand_id": string;
        "name": string;
        "body_type": string;
        "fuel_type": string;
        "transmission": string;
        "drivetrain": string;
        "year_start": number;
        "year_end": number;
        "engine_options": string;
        "is_active": boolean;
        "created_at": string;
        "updated_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "purchase_orders": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "supplier_id": string;
        "order_number": string;
        "status": string;
        "order_date": string;
        "expected_at": string;
        "received_at": string;
        "notes": string;
        "total_amount": number;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "work_order_helpers": {
        Row: {
        "id": string;
        "work_order_id": string;
        "organization_id": string;
        "mechanic_id": string;
        "assigned_at": string;
        "created_by": string;
        "created_at": string;
        "sort_order": number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "audit_logs": {
        Row: {
        "id": string;
        "organization_id": string;
        "branch_id": string;
        "user_id": string;
        "action": string;
        "table_name": string;
        "record_id": string;
        "old_data": string;
        "new_data": string;
        "ip_address": string;
        "user_agent": string;
        "created_at": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      "vehicle_models": {
        Row: {
        "id": string;
        "organization_id": string;
        "make": string;
        "model": string;
        "generation": string;
        "year_start": number;
        "year_end": number;
        "engine": string;
        "body_type": string;
        "is_active": boolean;
        "created_by": string;
        "updated_by": string;
        "created_at": string;
        "updated_at": string;
        "deleted_at": string;
        "class": string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: {
      "work_order_costs": {
        Row: {
        "work_order_id": string;
        "organization_id": string;
        "services_cost": number;
        "parts_cost": number;
        "services_revenue": number;
        "parts_revenue": number;
        "total_revenue": number;
        "total_cost": number;
        "gross_profit": number;
        "margin_percent": number;
        };
        Relationships: [];
      };
    };
    Functions: Record<
      string,
      { Args: Record<string, unknown>; Returns: unknown }
    >;
    Enums: Record<string, string[]>;
    CompositeTypes: Record<string, unknown>;
  };
};

type DatabaseTableNames = keyof Database["public"]["Tables"];
type DatabaseViewNames = keyof Database["public"]["Views"];
type DatabaseTableOrViewNames = DatabaseTableNames | DatabaseViewNames;

export type Tables<TableName extends DatabaseTableOrViewNames> =
  (Database["public"]["Tables"] & Database["public"]["Views"])[TableName] extends {
    Row: infer R;
  }
    ? R
    : Record<string, unknown>;

export type Enums<EnumName extends string> = string;

export type TablesInsert<TableName extends DatabaseTableNames> =
  Database["public"]["Tables"][TableName] extends { Insert: infer I }
    ? I
    : Record<string, unknown>;

export type TablesUpdate<TableName extends DatabaseTableNames> =
  Database["public"]["Tables"][TableName] extends { Update: infer U }
    ? U
    : Record<string, unknown>;
