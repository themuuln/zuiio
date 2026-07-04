# Tamga — Flutter Makefile
#
# Common commands for development and testing.
# Run `make help` to see available targets.

.PHONY: help install test coverage analyze

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install Flutter dependencies
	flutter pub get

test: ## Run all tests
	flutter test

coverage: ## Run tests with coverage, output to coverage/lcov.info
	flutter test --coverage

analyze: ## Run Dart static analysis
	dart analyze
