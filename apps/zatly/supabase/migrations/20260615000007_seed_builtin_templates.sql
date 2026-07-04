-- Migration: Seed built-in templates
-- Inserts 5 built-in templates with meaningful flow_json data.
-- Uses ON CONFLICT with a partial unique index for idempotency.

-- 1. Create partial unique index for built-in templates (by name)
-- This ensures idempotent inserts: running this migration again won't create duplicates.
create unique index if not exists flow_templates_builtin_name_idx
  on public.flow_templates (name)
  where is_builtin = true;

-- 2. Seed built-in templates
-- Each template has:
--   - is_builtin = true
--   - user_id = null
--   - meaningful flow_json with proper node/edge data matching the flow builder format

-- Template 1: Welcome Greeting
-- Flow: start -> sendMessage
-- Category: welcome
insert into public.flow_templates (name, description, category, channels, flow_json, is_builtin)
values (
  'Welcome Greeting',
  'A simple welcome flow that sends a greeting message to new conversations. Perfect for getting started with your bot.',
  'welcome',
  '{messenger}',
  '{
    "nodes": [
      {
        "id": "start-1",
        "type": "start",
        "position": { "x": 250, "y": 50 },
        "data": {
          "label": "Start",
          "trigger": "default",
          "keywords": []
        },
        "deletable": false
      },
      {
        "id": "send-welcome-1",
        "type": "sendMessage",
        "position": { "x": 200, "y": 250 },
        "data": {
          "label": "Send Message",
          "message": "Hi there! 👋 Welcome to our page! We''re excited to have you here. Feel free to reach out if you have any questions — we''re here to help!",
          "buttons": []
        }
      }
    ],
    "edges": [
      {
        "id": "e-welcome-1",
        "source": "start-1",
        "target": "send-welcome-1",
        "type": "smoothstep",
        "animated": false
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) where is_builtin = true do nothing;

-- Template 2: FAQ / Support
-- Flow: start (keyword trigger) -> condition -> sendMessage (yes branch) + sendMessage (no branch)
-- Category: support
insert into public.flow_templates (name, description, category, channels, flow_json, is_builtin)
values (
  'FAQ / Support',
  'An FAQ-style flow that routes users based on their message content. If the user mentions an order, it directs to order support; otherwise it offers general assistance.',
  'support',
  '{messenger}',
  '{
    "nodes": [
      {
        "id": "start-1",
        "type": "start",
        "position": { "x": 250, "y": 50 },
        "data": {
          "label": "Start",
          "trigger": "keyword",
          "keywords": ["help", "support", "faq", "question"]
        },
        "deletable": false
      },
      {
        "id": "cond-order-1",
        "type": "condition",
        "position": { "x": 250, "y": 200 },
        "data": {
          "label": "Condition",
          "field": "message",
          "operator": "contains",
          "value": "order"
        }
      },
      {
        "id": "send-order-1",
        "type": "sendMessage",
        "position": { "x": 50, "y": 380 },
        "data": {
          "label": "Send Message",
          "message": "I''d be happy to help you with your order! 🛍️ Please provide your order number so I can look up the details for you.",
          "buttons": []
        }
      },
      {
        "id": "send-general-1",
        "type": "sendMessage",
        "position": { "x": 450, "y": 380 },
        "data": {
          "label": "Send Message",
          "message": "I''m here to help! 🤗 You can ask me about our products, services, or anything else you''d like to know. What can I assist you with today?",
          "buttons": []
        }
      }
    ],
    "edges": [
      {
        "id": "e-faq-start-cond",
        "source": "start-1",
        "target": "cond-order-1",
        "type": "smoothstep",
        "animated": false
      },
      {
        "id": "e-faq-cond-yes",
        "source": "cond-order-1",
        "target": "send-order-1",
        "sourceHandle": "yes",
        "type": "smoothstep",
        "animated": false,
        "label": "Yes"
      },
      {
        "id": "e-faq-cond-no",
        "source": "cond-order-1",
        "target": "send-general-1",
        "sourceHandle": "no",
        "type": "smoothstep",
        "animated": false,
        "label": "No"
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) where is_builtin = true do nothing;

-- Template 3: Lead Capture
-- Flow: start -> askQuestion (name) -> setField -> askQuestion (phone)
-- Category: sales
insert into public.flow_templates (name, description, category, channels, flow_json, is_builtin)
values (
  'Lead Capture',
  'A lead generation flow that collects visitor information step by step. Captures name and phone number, and tags the lead source for your CRM.',
  'sales',
  '{messenger}',
  '{
    "nodes": [
      {
        "id": "start-1",
        "type": "start",
        "position": { "x": 250, "y": 50 },
        "data": {
          "label": "Start",
          "trigger": "default",
          "keywords": []
        },
        "deletable": false
      },
      {
        "id": "ask-name-1",
        "type": "askQuestion",
        "position": { "x": 200, "y": 200 },
        "data": {
          "label": "Ask Question",
          "question": "Thanks for reaching out! 💬 What''s your name so I can assist you better?",
          "saveToField": "name",
          "buttons": []
        }
      },
      {
        "id": "set-source-1",
        "type": "setField",
        "position": { "x": 200, "y": 360 },
        "data": {
          "label": "Set Field",
          "field": "lead_source",
          "value": "facebook_messenger"
        }
      },
      {
        "id": "ask-phone-1",
        "type": "askQuestion",
        "position": { "x": 200, "y": 520 },
        "data": {
          "label": "Ask Question",
          "question": "Great, {{name}}! 🎉 What''s the best phone number where we can reach you?",
          "saveToField": "phone",
          "buttons": []
        }
      }
    ],
    "edges": [
      {
        "id": "e-lead-start-ask",
        "source": "start-1",
        "target": "ask-name-1",
        "type": "smoothstep",
        "animated": false
      },
      {
        "id": "e-lead-ask-set",
        "source": "ask-name-1",
        "target": "set-source-1",
        "type": "smoothstep",
        "animated": false
      },
      {
        "id": "e-lead-set-ask2",
        "source": "set-source-1",
        "target": "ask-phone-1",
        "type": "smoothstep",
        "animated": false
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) where is_builtin = true do nothing;

-- Template 4: Order Confirmation
-- Flow: start -> sendMessage -> cardCarousel
-- Category: notifications
insert into public.flow_templates (name, description, category, channels, flow_json, is_builtin)
values (
  'Order Confirmation',
  'An order confirmation flow that sends a summary message followed by a card carousel displaying order details. Great for e-commerce notifications.',
  'notifications',
  '{messenger}',
  '{
    "nodes": [
      {
        "id": "start-1",
        "type": "start",
        "position": { "x": 250, "y": 50 },
        "data": {
          "label": "Start",
          "trigger": "default",
          "keywords": []
        },
        "deletable": false
      },
      {
        "id": "send-confirm-1",
        "type": "sendMessage",
        "position": { "x": 200, "y": 200 },
        "data": {
          "label": "Send Message",
          "message": "Your order has been confirmed! ✅ Here''s a summary of your purchase:",
          "buttons": []
        }
      },
      {
        "id": "card-carousel-1",
        "type": "cardCarousel",
        "position": { "x": 200, "y": 380 },
        "data": {
          "label": "Card Carousel",
          "cards": [
            {
              "id": "card-1",
              "title": "Order #ORD-5842",
              "subtitle": "Placed on June 15, 2026\nTotal: $89.97\nStatus: Confirmed ✅",
              "imageUrl": "",
              "buttons": [
                { "id": "btn-1", "text": "Track Order", "type": "postback", "value": "track_order" },
                { "id": "btn-2", "text": "Contact Support", "type": "postback", "value": "contact_support" }
              ]
            },
            {
              "id": "card-2",
              "title": "Premium Wireless Headphones",
              "subtitle": "Qty: 1 • $49.99\nEstimated delivery: Jun 20-22",
              "imageUrl": "",
              "buttons": [
                { "id": "btn-3", "text": "View Product", "type": "url", "value": "" }
              ]
            },
            {
              "id": "card-3",
              "title": "Phone Case - Matte Black",
              "subtitle": "Qty: 2 • $19.99 each\nEstimated delivery: Jun 18-20",
              "imageUrl": "",
              "buttons": [
                { "id": "btn-4", "text": "View Product", "type": "url", "value": "" }
              ]
            }
          ]
        }
      }
    ],
    "edges": [
      {
        "id": "e-order-start-send",
        "source": "start-1",
        "target": "send-confirm-1",
        "type": "smoothstep",
        "animated": false
      },
      {
        "id": "e-order-send-carousel",
        "source": "send-confirm-1",
        "target": "card-carousel-1",
        "type": "smoothstep",
        "animated": false
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) where is_builtin = true do nothing;

-- Template 5: Feedback Collection
-- Flow: start -> askQuestion (rating) -> delay -> askQuestion (details)
-- Category: general
insert into public.flow_templates (name, description, category, channels, flow_json, is_builtin)
values (
  'Feedback Collection',
  'A feedback collection flow that asks for a rating, waits before following up, and then asks for detailed feedback. Ideal for post-purchase or post-interaction surveys.',
  'general',
  '{messenger}',
  '{
    "nodes": [
      {
        "id": "start-1",
        "type": "start",
        "position": { "x": 250, "y": 50 },
        "data": {
          "label": "Start",
          "trigger": "default",
          "keywords": []
        },
        "deletable": false
      },
      {
        "id": "ask-rating-1",
        "type": "askQuestion",
        "position": { "x": 200, "y": 200 },
        "data": {
          "label": "Ask Question",
          "question": "How would you rate your experience with us? ⭐",
          "saveToField": "rating",
          "buttons": [
            { "id": "rat-5", "text": "Excellent 😍" },
            { "id": "rat-4", "text": "Good 🙂" },
            { "id": "rat-3", "text": "Average 😐" },
            { "id": "rat-2", "text": "Poor 😞" }
          ]
        }
      },
      {
        "id": "delay-feedback-1",
        "type": "delay",
        "position": { "x": 200, "y": 380 },
        "data": {
          "label": "Delay",
          "duration": 30,
          "unit": "minutes"
        }
      },
      {
        "id": "ask-details-1",
        "type": "askQuestion",
        "position": { "x": 200, "y": 560 },
        "data": {
          "label": "Ask Question",
          "question": "Thanks for your rating! 💙 We''d love to hear more about your experience. Could you share any details about what we did well or how we can improve?",
          "saveToField": "feedback_details",
          "buttons": []
        }
      }
    ],
    "edges": [
      {
        "id": "e-feedback-start-ask",
        "source": "start-1",
        "target": "ask-rating-1",
        "type": "smoothstep",
        "animated": false
      },
      {
        "id": "e-feedback-ask-delay",
        "source": "ask-rating-1",
        "target": "delay-feedback-1",
        "type": "smoothstep",
        "animated": false
      },
      {
        "id": "e-feedback-delay-ask2",
        "source": "delay-feedback-1",
        "target": "ask-details-1",
        "type": "smoothstep",
        "animated": false
      }
    ]
  }'::jsonb,
  true
)
on conflict (name) where is_builtin = true do nothing;
