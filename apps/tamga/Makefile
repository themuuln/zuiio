# Tamga — Flutter Makefile
#
# Development, CI, and release commands.
# Run `make help` to see available targets.
.PHONY: help install generate test coverage analyze format format-check \
        check build-apk build-apk-universal build-aab \
        precommit setup-hooks clean \
        marionette-smoke marionette-uri marionette-register marionette-check \
        marionette-run marionette-attach marionette-stop integration-test \

generate: ## Regenerate Dart code and normalize Isar schemas for web
	dart run build_runner build --delete-conflicting-outputs
	dart run tool/fix_isar_web_schemas.dart

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

MARIONETTE ?= $(if $(shell command -v marionette 2>/dev/null),$(shell command -v marionette),$(HOME)/.pub-cache/bin/marionette)
MARIONETTE_NAME ?= $(if $(NAME),$(NAME),tamga)
MARIONETTE_PORT ?= $(if $(PORT),$(PORT),8181)
MARIONETTE_DEVICE ?= $(DEVICE)

marionette-smoke: ## Run smoke test against a running debug build (uses published URI when uri= is omitted)
	@URI="$(uri)"; \
	if [ -z "$$URI" ]; then URI="$$(cat "/tmp/tamga-marionette-$(MARIONETTE_NAME).uri" 2>/dev/null || true)"; fi; \
	scripts/marionette-smoke.sh -u "$$URI"

marionette-uri: ## Print the published VM service URI from marionette-run
	@URI_FILE="/tmp/tamga-marionette-$(MARIONETTE_NAME).uri"; \
	if [ -s "$$URI_FILE" ]; then cat "$$URI_FILE"; else echo "ERROR: $$URI_FILE not found; run tmario first." >&2; exit 1; fi

marionette-register: ## Register app and list elements. Usage: make marionette-register uri=ws://... name=tamga
ifndef uri
	@echo "ERROR: Missing uri=ws://..."
	@exit 1
endif
	$(MARIONETTE) register $(name) $(uri) && $(MARIONETTE) get-interactive-elements -i $(name)

marionette-check: ## Full gate + smoke test (app must be running; uses published URI when uri= is omitted)
	$(MAKE) format-check
	$(MAKE) analyze-strict
	$(MAKE) test-random
	$(MAKE) marionette-smoke uri=$(uri)

marionette-run: ## Run Flutter with env + auto-register Marionette (override: DEVICE=... PORT=... NAME=...)
	MARIONETTE="$(MARIONETTE)" NAME="$(MARIONETTE_NAME)" PORT="$(MARIONETTE_PORT)" DEVICE="$(MARIONETTE_DEVICE)" scripts/marionette-run.sh
marionette-attach: ## Attach Marionette to an existing Flutter VM service (optional: uri=http://... name=tamga)
	MARIONETTE="$(MARIONETTE)" NAME="$(MARIONETTE_NAME)" URI="$(uri)" scripts/marionette-attach.sh
marionette-stop: ## Stop the marionette-run flutter process (from /tmp/tamga-flutter.pid)
	@PID=$$(cat /tmp/tamga-flutter.pid 2>/dev/null); \
	if [ -n "$$PID" ] && kill -0 "$$PID" 2>/dev/null; then \
		$(MARIONETTE) unregister "$(MARIONETTE_NAME)" 2>/dev/null || true; \
		kill "$$PID" 2>/dev/null && echo "✓ Stopped (PID $$PID)" || echo "Could not stop PID $$PID"; \
		rm -f /tmp/tamga-flutter.pid "/tmp/tamga-marionette-$(MARIONETTE_NAME).uri"; \
	else \
		echo "(no running tamga flutter process found)"; \
	fi

# ── Maestro (black-box UI regression testing) ──────────────────────

MAESTRO ?= maestro

# ── Integration tests (integration_test/) ──────────────────────
# Run on a device/emulator via flutter drive. The app must be
# buildable for the target (iOS simulator currently — android/ is
# Expo/React Native during the Flutter→Expo migration).

integration-test: ## Run integration tests. Usage: make integration-test [device=<udid>]
ifdef device
	flutter drive --driver=test_driver/integration_test.dart --target=integration_test/onboarding_flow_test.dart -d $(device)
else
	flutter drive --driver=test_driver/integration_test.dart --target=integration_test/onboarding_flow_test.dart
endif

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

maestro-redesign: ## Run Tamga priority redesign navigation flow. Usage: make maestro-redesign [device=iPhone-17]
ifdef device
	$(MAESTRO) test --device "$(device)" test/maestro/14-redesign-priority-navigation.yaml
else
	$(MAESTRO) test test/maestro/14-redesign-priority-navigation.yaml
endif


maestro-check: ## Full gate + Maestro tests. Usage: make maestro-check [device=iPhone-17]
	$(MAKE) format-check
	$(MAKE) analyze-strict
	$(MAKE) test-random
ifdef device
	$(MAKE) maestro-smoke device=$(device)
	$(MAKE) maestro-onboarding device=$(device)
	$(MAKE) maestro-redesign device=$(device)
else
	$(MAKE) maestro-smoke
	$(MAKE) maestro-onboarding
	$(MAKE) maestro-redesign
endif
