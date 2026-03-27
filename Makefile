.PHONY: build test lint dev clean help ask setup config-which

# Default: show available targets
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build the project
	pnpm build

test: ## Run tests and lint
	pnpm test

lint: ## Run linter only
	pnpm lint

clean: ## Remove build artifacts
	rm -rf dist oclif.manifest.json

dev: build ## Build and run with args (e.g. make dev ARGS="browse https://example.com")
	node bin/run.js $(ARGS)

search: build ## Run zurf search (e.g. make search Q="browserbase docs")
	node bin/run.js search "$(Q)"

browse: build ## Run zurf browse (e.g. make browse URL=https://example.com)
	node bin/run.js browse $(URL)

fetch: build ## Run zurf fetch (e.g. make fetch URL=https://example.com)
	node bin/run.js fetch $(URL)

ask: build ## Run zurf ask (e.g. make ask Q="What is Browserbase?")
	node bin/run.js ask "$(Q)"

setup: build ## Run zurf setup wizard
	node bin/run.js setup $(ARGS)

config-which: build ## Show where API keys are loaded from
	node bin/run.js config which $(ARGS)
