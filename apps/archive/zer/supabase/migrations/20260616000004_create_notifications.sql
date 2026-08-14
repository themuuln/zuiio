-- Create notification_configs table
CREATE TABLE IF NOT EXISTS public.notification_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email')),
    enabled BOOLEAN DEFAULT true,
    -- For telegram: { "bot_token": "...", "chat_id": "..." }
    -- For email: { "recipient": "..." }
    config_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notifications table for log
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email')),
    event_type TEXT NOT NULL, -- 'low_stock', 'daily_summary', 'invoice_paid', 'new_sale', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_configs
CREATE POLICY "notification_configs_select_own_org" ON public.notification_configs
    FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "notification_configs_insert_own_org" ON public.notification_configs
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

CREATE POLICY "notification_configs_update_own_org" ON public.notification_configs
    FOR UPDATE USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "notification_configs_delete_own_org" ON public.notification_configs
    FOR DELETE USING (organization_id = (SELECT get_current_organization()));

-- RLS policies for notifications
CREATE POLICY "notifications_select_own_org" ON public.notifications
    FOR SELECT USING (organization_id = (SELECT get_current_organization()));

CREATE POLICY "notifications_insert_own_org" ON public.notifications
    FOR INSERT WITH CHECK (organization_id = (SELECT get_current_organization()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_configs_organization_id ON public.notification_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
