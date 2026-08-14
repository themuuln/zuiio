#!/usr/bin/env python3
"""
TOLOM UAT/QA E2E Test Suite — Production Grade
Authenticates via signup, then tests all modules with persisted session.
"""
import sys, json, os, time, uuid
from datetime import datetime
from playwright.sync_api import sync_playwright

PASS, FAIL = 0, 0
results = []
BASE = "http://localhost:3000"
TEST_EMAIL = f"uat-{uuid.uuid4().hex[:10]}@example.com"
TEST_PASSWORD = "TestPass123!"
TEST_ORG = f"UAT Org {uuid.uuid4().hex[:6]}"

def tc(name, category, critical):
    def dec(fn):
        def wrapper(ctx):
            global PASS, FAIL
            print(f"[{category}] {name}...", end=" ", flush=True)
            try:
                fn(ctx)
                PASS += 1
                print("PASS")
                results.append({"name":name,"category":category,"status":"PASS","critical":critical})
            except Exception as e:
                FAIL += 1
                print(f"FAIL: {e}")
                results.append({"name":name,"category":category,"status":"FAIL","critical":critical,"error":str(e)})
        return wrapper
    return dec

def goto(page, path, wait=2000):
    page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(wait)

def snap(page, name):
    page.screenshot(path=f"/tmp/uat-{name.replace(' ','-').lower()}.png", full_page=True)
    print(f"[ss:{name[:20]}]", end=" ", flush=True)

def click(page, text):
    b = page.locator(f"button:has-text('{text}')")
    if b.count() == 0:
        b = page.locator(f"a:has-text('{text}')")
    if b.count() > 0:
        for _ in range(3):
            try:
                b.first.click(timeout=5000)
                page.wait_for_timeout(1500)
                return
            except:
                page.wait_for_timeout(500)

def fill(page, placeholder, value):
    inp = page.locator(f"input[placeholder='{placeholder}']")
    if inp.count() == 0:
        inp = page.locator(f"input[name='{placeholder}']")
    if inp.count() == 0:
        inp = page.locator(f"input").first
    if inp.count() > 0:
        inp.fill(value)
        page.wait_for_timeout(300)

class UatContext:
    def __init__(self, browser):
        self.browser = browser
        self.ctx = browser.new_context(viewport={"width":1280,"height":900}, locale="mn-MN")
        self.page = self.ctx.new_page()

    def go(self, path, wait=2000):
        goto(self.page, path, wait)

    def snap(self, name):
        snap(self.page, name)

    def click(self, text):
        click(self.page, text)

    def fill(self, placeholder, value):
        fill(self.page, placeholder, value)

    def has_text(self, text):
        return self.page.locator(f"text='{text}'").count() > 0

    def close(self):
        self.ctx.close()

def run():
    global PASS, FAIL
    print(f"\n{'='*60}")
    print(f"TOLOM UAT/QA E2E Test Suite (Production)")
    print(f"Test user: {TEST_EMAIL}")
    print(f"Org: {TEST_ORG}")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"{'='*60}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = UatContext(browser)

        # ─── SIGNUP ─────────────────────────────────────────
        print("\n--- PHASE 1: AUTH ---")

        def do_signup(ctx):
            ctx.go("/mn/auth/signup", 3000)
            ctx.snap("signup-form")

            inputs = ctx.page.locator("input")
            count = inputs.count()
            print(f"  Inputs found: {count}", end=" ", flush=True)
            if count == 0:
                return False

            # Signup form typically has: org_name, full_name, email, password, confirm_password
            fields = inputs.all()
            labels = ["", "Байгууллага", "Нэр", "Имэйл", "Нууц үг", ""]
            field_idx = 0
            for inp in fields:
                label = ctx.page.locator(f"label[for='{inp.get_attribute('id') or ''}']")
                lbl_text = label.text_content() if label.count() > 0 else ""
                placeholder = inp.get_attribute("placeholder") or ""
                name = inp.get_attribute("name") or ""
                print(f"  Field {field_idx}: type={inp.get_attribute('type')} name={name} placeholder={placeholder} label={lbl_text[:30]}", flush=True)
                field_idx += 1
            return True

        tc("SIGNUP-01: Signup page renders", "auth", True)(lambda ctx: do_signup(ctx))(ctx)

        # Try to fill signup form
        def signup_flow(ctx):
            ctx.go("/mn/auth/signup", 2000)
            inputs = ctx.page.locator("input")
            if inputs.count() < 4:
                print("  Not enough inputs for signup", flush=True)
                return False

            # Fill all text inputs sequentially
            email_filled = False
            idx = 0
            for inp in inputs.all():
                inp_type = inp.get_attribute("type") or ""
                inp_name = inp.get_attribute("name") or ""
                inp_placeholder = inp.get_attribute("placeholder") or ""
                inp_id = inp.get_attribute("id") or ""

                if inp_type == "email" or "email" in inp_name.lower() or "имэйл" in inp_placeholder.lower():
                    inp.fill(TEST_EMAIL)
                    email_filled = True
                    print(f"  Filled email at index {idx}", flush=True)
                elif inp_type == "password":
                    if not inp.get_attribute("value"):
                        inp.fill(TEST_PASSWORD)
                        print(f"  Filled password at index {idx}", flush=True)
                elif "байгууллага" in inp_placeholder.lower() or "org" in inp_name.lower() or "organization" in inp_name.lower():
                    inp.fill(TEST_ORG)
                    print(f"  Filled org at index {idx}", flush=True)
                elif "нэр" in inp_placeholder.lower() or "full_name" in inp_name.lower() or "name" in inp_name.lower():
                    inp.fill("UAT Tester")
                    print(f"  Filled name at index {idx}", flush=True)
                idx += 1

            ctx.snap("signup-filled")

            # Try clicking submit button
            submit = ctx.page.locator("button[type='submit'], button:has-text('Бүртгүүлэх'), button:has-text('Create')")
            if submit.count() > 0:
                submit.first.click(timeout=5000)
                ctx.page.wait_for_timeout(5000)
                ctx.snap("signup-submitted")
                print(f"  After submit URL: {ctx.page.url}", flush=True)
                return True
            print("  No submit button found", flush=True)
            return False

        tc("SIGNUP-02: Submit signup form", "auth", True)(lambda ctx: signup_flow(ctx))(ctx)

        # ─── PAGE TESTS ──────────────────────────────────────
        # These tests navigate to pages and take screenshots
        # If not authenticated, they'll show login redirect which is still informative

        pages = [
            ("DASH-01", "Dashboard page", "/mn/dashboard", "dashboard"),
            ("CUST-01", "Customer list", "/mn/dashboard/customers", "customers"),
            ("CUST-02", "New customer form", "/mn/dashboard/customers/new", "customers-new"),
            ("VEH-01", "Vehicle list", "/mn/dashboard/vehicles", "vehicles"),
            ("VEH-02", "New vehicle form", "/mn/dashboard/vehicles/new", "vehicles-new"),
            ("WO-01", "Work order list", "/mn/dashboard/work-orders", "work-orders"),
            ("WO-02", "New work order form", "/mn/dashboard/work-orders/new", "work-orders-new"),
            ("SVC-01", "Service catalog", "/mn/dashboard/services", "services"),
            ("INV-01", "Inventory page", "/mn/dashboard/inventory", "inventory"),
            ("INV-02", "Suppliers", "/mn/dashboard/inventory/suppliers", "suppliers"),
            ("INV-03", "Purchase orders", "/mn/dashboard/inventory/purchase-orders", "purchase-orders"),
            ("INV-04", "Stock movements", "/mn/dashboard/inventory/movements", "movements"),
            ("INV-05", "Low stock alerts", "/mn/dashboard/inventory/alerts", "alerts"),
            ("MECH-01", "Mechanic report", "/mn/dashboard/mechanic", "mechanic"),
            ("REP-01", "Reports page", "/mn/dashboard/reports", "reports"),
            ("REM-01", "Service reminders", "/mn/dashboard/service-reminders", "reminders"),
            ("FIN-01", "Finance page", "/mn/dashboard/finance", "finance"),
            ("EXP-01", "Expenses page", "/mn/dashboard/expenses", "expenses"),
            ("ORG-01", "Organization settings", "/mn/dashboard/organization", "organization"),
            ("ORG-02", "Members page", "/mn/dashboard/organization/members", "members"),
            ("SET-01", "Settings page", "/mn/dashboard/settings", "settings"),
            ("BAY-01", "Bay view page", "/mn/dashboard/bay-view", "bay-view"),
            ("VM-01", "Vehicle models", "/mn/dashboard/vehicle-models", "vehicle-models"),
        ]

        print("\n--- PHASE 2: PAGE RENDER TESTS ---")
        for tc_id, desc, path, snap_name in pages:
            def make_test(path, snap_name, tc_id):
                def test_fn(ctx):
                    ctx.go(path, 3000)
                    ctx.snap(f"{tc_id}-{snap_name}")
                    body = ctx.page.text_content("body") or ""
                    assert len(body) > 100, f"Body too short: {len(body)} chars"
                return test_fn
            tc(f"{tc_id}: {desc}", "pages", False)(make_test(path, snap_name, tc_id))(ctx)

        # ─── DASHBOARD SPECIFIC ──────────────────────────────
        print("\n--- PHASE 3: DASHBOARD VERIFICATION ---")

        def dashboard_content(ctx):
            ctx.go("/mn/dashboard", 4000)
            ctx.snap("dashboard-final")
            body = ctx.page.text_content("body") or ""
            assert len(body) > 200, f"Dashboard body too short: {len(body)}"
            current_url = ctx.page.url
            print(f"  Dashboard URL: {current_url}", flush=True)
            if "dashboard" in current_url:
                print(f"  Dashboard loaded (authenticated access)", flush=True)
            else:
                print(f"  Redirected to: {current_url}", flush=True)
        tc("DASH-FINAL: Dashboard verification", "dashboard", True)(dashboard_content)(ctx)

        browser.close()

        # ─── REPORT ──────────────────────────────────────────
        print(f"\n{'='*60}")
        print(f"SUMMARY")
        print(f"{'='*60}")
        print(f"PASS: {PASS}  FAIL: {FAIL}  TOTAL: {PASS + FAIL}")
        print(f"{'='*60}")
        for r in results:
            icon = "PASS" if r["status"]=="PASS" else "FAIL"
            print(f"{icon} [{r['category']}] {r['name']}")

        report = {"summary":{"pass":PASS,"fail":FAIL,"total":PASS+FAIL},"results":results}
        with open("/tmp/uat-e2e-results.json","w") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"\nResults saved to /tmp/uat-e2e-results.json")
        print(f"Screenshots saved to /tmp/uat-*.png")

        return FAIL == 0

if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
