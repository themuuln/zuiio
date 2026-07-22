# Tamga — Flutter Makefile
#
# Development, CI, and release commands.
# Run `make help` to see available targets.
.PHONY: help install test coverage analyze format format-check \
        check build-apk build-apk-universal build-aab \
        precommit setup-hooks clean \
        marionette-smoke marionette-uri marionette-register marionette-check \
        marionette-run marionette-stop \

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Development ─────────────────────────────────────────────────

install: ## Install Flutter dependencies
	flutter pub get

test: ## Run all unit and widget tests
	flutter test

test-random: ## Run tests in random order (catches ordering bugs)
	flutter test --test-randomize-ordering-seed=random

coverage: ## Run tests with coverage, output to coverage/lcov.info
	flutter test --coverage

analyze: ## Run Dart static analysis
	dart analyze

analyze-strict: ## Run analysis with infos as errors
	dart analyze --fatal-infos

format: ## Format all Dart source files
	dart format .

format-check: ## Check formatting without changing files
	dart format --output=none --set-exit-if-changed .

# ── CI checks (matches what GitHub Actions runs) ────────────────

check: ## Run the full CI quality gate locally
	$(MAKE) format-check && $(MAKE) analyze-strict && $(MAKE) test-random

# ── Build ───────────────────────────────────────────────────────

build-apk: ## Build release APK (split per ABI)
	flutter build apk --release --split-per-abi

build-apk-universal: ## Build universal release APK
	flutter build apk --release

build-aab: ## Build release App Bundle
	flutter build appbundle --release

# ── Pre-commit hooks ────────────────────────────────────────────

precommit: ## Run pre-commit checks manually
	.githooks/pre-commit

setup-hooks: ## Install git hooks (run once per clone)
	git config core.hooksPath .githooks
	chmod +x .githooks/*
	@echo "Hooks installed at .githooks/"

# ── Cleanup ──────────────────────────────────────────────────────

clean: ## Clean Flutter build artifacts
	flutter clean
	find . -name "*.g.dart" -delete 2>/dev/null || true
	find . -d -name ".dart_tool" -exec rm -rf {} + 2>/dev/null || true

# ── Marionette (AI-driven UI smoke tests) ─────────────────────────

MARIONETTE ?= marionette

marionette-smoke: ## Run smoke test against a running debug build. Usage: make marionette-smoke uri=ws://...
ifndef uri
	@echo "ERROR: Missing uri=ws://... — pass the VM service URI from 'flutter run' output"
	@echo ""
	@echo "  $$(MAKE) marionette-smoke uri=ws://127.0.0.1:64102/XXXX/ws"
	@exit 1
endif
	scripts/marionette-smoke.sh -u $(uri)

marionette-uri: ## Print the VM service URI from a running flutter process (Apple platforms)
	@echo "Reading VM service URI from the Flutter process..."
	@# Extract ws:// URI from flutter run output in log files or process info
	@ps aux | grep -i "flutter.*run" | grep -v grep | awk '{print $$2}' | head -1 | xargs -I{} lsof -p {} -i TCP -s TCP:LISTEN -nP 2>/dev/null | grep LISTEN | awk '{print $$9}' | head -1 | xargs -I{} echo "http://{}:$$(echo {} | cut -d: -f2)/"
	@echo "  (Copy the full URI from 'flutter run' output instead — port alone is insufficient)"

marionette-register: ## Register app and list elements. Usage: make marionette-register uri=ws://... name=tamga
ifndef uri
	@echo "ERROR: Missing uri=ws://..."
	@exit 1
endif
	$(MARIONETTE) register $(name) $(uri) && $(MARIONETTE) get-interactive-elements -i $(name)

marionette-check: ## Full gate + smoke test (app must be running). Usage: make marionette-check uri=ws://...
	$(MAKE) format-check
	$(MAKE) analyze-strict
	$(MAKE) test-random
	$(MAKE) marionette-smoke uri=$(uri)

marionette-run: ## Run flutter app on port 8181 + auto-register for agent (override: PORT=8182)
	scripts/marionette-run.sh
marionette-stop: ## Stop the marionette-run flutter process (from /tmp/tamga-flutter.pid)
	@PID=$$(cat /tmp/tamga-flutter.pid 2>/dev/null); \
	if [ -n "$$PID" ] && kill -0 "$$PID" 2>/dev/null; then \
		$(MARIONETTE) unregister tamga 2>/dev/null || true; \
		kill "$$PID" 2>/dev/null && echo "✓ Stopped (PID $$PID)" || echo "Could not stop PID $$PID"; \
		rm -f /tmp/tamga-flutter.pid; \
	else \
		echo "(no running tamga flutter process found)"; \
	fi

# ── Maestro (black-box UI regression testing) ──────────────────────

MAESTRO ?= maestro

maestro-smoke: ## Run Maestro smoke test. Usage: make maestro-smoke [device=iPhone-17]
ifdef device
	$(MAESTRO) test --device "$(device)" test/maestro/smoke.yaml
else
	$(MAESTRO) test test/maestro/smoke.yaml
endif

maestro-onboarding: ## Run Maestro onboarding flow. Usage: make maestro-onboarding [device=iPhone-17]
ifdef device
	$(MAESTRO) test --device "$(device)" test/maestro/onboarding.yaml
else
	$(MAESTRO) test test/maestro/onboarding.yaml
endif

maestro-check: ## Full gate + Maestro tests. Usage: make maestro-check [device=iPhone-17]
	$(MAKE) format-check
	$(MAKE) analyze-strict
	$(MAKE) test-random
ifdef device
	$(MAKE) maestro-smoke device=$(device)
	$(MAKE) maestro-onboarding device=$(device)
else
	$(MAKE) maestro-smoke
	$(MAKE) maestro-onboarding
endif
