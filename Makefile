.PHONY: build test lint dev clean help

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
