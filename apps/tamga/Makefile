# Tamga — Flutter Makefile
#
# Development, CI, and release commands.
# Run `make help` to see available targets.

.PHONY: help install test coverage analyze format format-check \
        check build-apk build-apk-universal build-aab \
        precommit setup-hooks clean

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
