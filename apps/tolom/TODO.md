# TOLOM Phase 1 TODO

## Scope

Phase 1 is only the tablet-first startup CRM for auto service shops.

## Core Product Tasks

- [ ] Build tablet-first shell for front desk and garage workflow
- [ ] Support only 2 roles for now: `admin`, `mechanic`
- [ ] Create customer CRM flow
- [ ] Create vehicle CRM flow
- [ ] Store required vehicle data:
  - [ ] Plate number (`9999 UNA` style)
  - [ ] Make / mark
  - [ ] Model
  - [ ] Year
  - [ ] VIN / chassis
  - [ ] Customer phone number
  - [ ] Color
  - [ ] Odometer
  - [ ] Engine
  - [ ] Fuel type
  - [ ] Transmission
- [ ] Add good-to-have vehicle fields:
  - [ ] Trim / series
  - [ ] Drivetrain
  - [ ] Body type
  - [ ] License expiry or inspection notes
  - [ ] Last visit date
  - [ ] Next recommended service date
  - [ ] Internal notes / tags
- [ ] Implement fast plate-number search
- [ ] Prevent duplicate vehicle/customer creation where possible
- [ ] Create work order flow
- [ ] Define work order statuses:
  - [ ] New
  - [ ] Diagnosing
  - [ ] In Progress
  - [ ] Ready for Pickup
  - [ ] Completed
  - [ ] Cancelled
- [ ] Add mechanic assignment to work orders
- [ ] Add service catalog
- [ ] Use default service prices from the catalog
- [ ] Support service base cost
- [ ] Support discount in tugrik
- [ ] Support discount in percentage
- [ ] Support quantity
- [ ] Support manual part entry
- [ ] Show `last sold price` for services
- [ ] Show `last sold price` for parts
- [ ] Keep current price editable beside history-based suggestions
- [ ] Save vehicle-specific pricing history
- [ ] Save service and part pricing history for later suggestions
- [ ] Build service summary and totals review
- [ ] Save service history per vehicle
- [ ] Build basic dashboard

## Reports

- [ ] Add mechanic selection dropdown on the top right
- [ ] Add right-side timeline for job/service activity
- [ ] Add daily report per mechanic
- [ ] Add weekly report per mechanic
- [ ] Add monthly report per mechanic
- [ ] Add end-of-day summary

## UX / QoL

- [ ] Use large touch-friendly targets for tablet use
- [ ] Auto-fill customer and vehicle data from previous visits
- [ ] Use smart default values where possible
- [ ] Suggest prices from recent history
- [ ] Remember recent values by vehicle make / model and service type
- [ ] Keep price fields editable by admin
- [ ] Use defaults first, then allow manual override
- [ ] Minimize typing for mechanics
- [ ] Keep critical actions and filters visible

## Data Rules

- [ ] Keep multi-tenant structure from the master plan
- [ ] Keep RLS from day one
- [ ] Save clean report events
- [ ] Save work order status history
- [ ] Save pricing context by vehicle make / model when possible
- [ ] Save work order, mechanic, quantity, discount, and final sold price history

## Infrastructure & Tooling

- [ ] Add Sentry for error monitoring (production)
- [ ] Add Inngest for background jobs:
  - [ ] Service reminder emails
  - [ ] Auto-close stale work orders
  - [ ] Monthly report generation
  - [ ] Invoice follow-up reminders
- [ ] Add Playwright E2E tests for critical paths
- [ ] Add Zustand for client-only state (UI state, multi-step form progress)

## Not In Phase 1

- [ ] Do not build payments yet
- [ ] Do not build invoice workflow yet
- [ ] Do not build QPay yet
- [ ] Do not build SMS reminders yet
- [ ] Do not build advanced inventory control yet
- [ ] Do not build supplier management yet
- [ ] Do not build supplier / purchase order flows yet
- [ ] Do not build file/photo upload yet
- [ ] Do not build accounting export yet
- [ ] Do not build multi-branch flows yet
- [ ] Do not build approval workflows yet
- [ ] Do not build Flutter app yet
- [ ] Do not build AI features yet
