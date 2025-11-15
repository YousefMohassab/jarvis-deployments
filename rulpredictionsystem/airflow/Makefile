# ====================================================================================================
# Makefile for Airflow RUL Prediction Pipeline
# ====================================================================================================
#
# Common commands for managing the Airflow pipeline
#
# Usage:
#   make help           - Show this help message
#   make init           - Initialize Airflow
#   make start          - Start Airflow services
#   make stop           - Stop Airflow services
#   make restart        - Restart Airflow services
#   make status         - Check service status
#   make logs           - View logs
#   make test           - Run tests
#   make clean          - Clean temporary files
#
# ====================================================================================================

.PHONY: help init start stop restart status logs test clean docker-up docker-down validate deploy

# Default target
.DEFAULT_GOAL := help

# Variables
AIRFLOW_HOME := $(shell pwd)
PROJECT_ROOT := $(shell dirname $(AIRFLOW_HOME))
PYTHON := python3
DOCKER_COMPOSE := docker-compose

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# ====================================================================================================
# Help
# ====================================================================================================

help: ## Show this help message
	@echo "$(GREEN)=====================================================================================================$(NC)"
	@echo "$(GREEN)Airflow RUL Prediction Pipeline - Makefile Commands$(NC)"
	@echo "$(GREEN)=====================================================================================================$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ====================================================================================================
# Initialization
# ====================================================================================================

init: ## Initialize Airflow (database, admin user, connections)
	@echo "$(GREEN)Initializing Airflow...$(NC)"
	@./scripts/init_airflow.sh
	@echo "$(GREEN)Initialization complete!$(NC)"

init-reset: ## Reset and reinitialize Airflow (WARNING: deletes all data)
	@echo "$(YELLOW)WARNING: This will delete all Airflow data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		./scripts/init_airflow.sh --reset; \
	else \
		echo "Cancelled."; \
	fi

# ====================================================================================================
# Service Management
# ====================================================================================================

start: ## Start Airflow services (webserver + scheduler)
	@echo "$(GREEN)Starting Airflow services...$(NC)"
	@./start_airflow.sh

stop: ## Stop Airflow services
	@echo "$(GREEN)Stopping Airflow services...$(NC)"
	@./stop_airflow.sh

restart: stop start ## Restart Airflow services

status: ## Check Airflow service status
	@echo "$(GREEN)Checking service status...$(NC)"
	@ps aux | grep -E "airflow (webserver|scheduler)" | grep -v grep || echo "No Airflow processes running"

# ====================================================================================================
# Docker Management
# ====================================================================================================

docker-up: ## Start Airflow with Docker Compose
	@echo "$(GREEN)Starting Airflow with Docker Compose...$(NC)"
	@$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Webserver: http://localhost:8080"

docker-down: ## Stop Airflow Docker services
	@echo "$(GREEN)Stopping Airflow Docker services...$(NC)"
	@$(DOCKER_COMPOSE) down

docker-restart: docker-down docker-up ## Restart Airflow Docker services

docker-logs: ## View Docker service logs
	@$(DOCKER_COMPOSE) logs -f

docker-ps: ## List Docker service status
	@$(DOCKER_COMPOSE) ps

docker-build: ## Build custom Airflow Docker image
	@echo "$(GREEN)Building custom Airflow image...$(NC)"
	@docker build -t rul-airflow:latest .
	@echo "$(GREEN)Build complete!$(NC)"

# ====================================================================================================
# DAG Management
# ====================================================================================================

validate: ## Validate all DAG files
	@echo "$(GREEN)Validating DAGs...$(NC)"
	@./scripts/check_dags.sh

deploy: ## Deploy DAGs (with validation and backup)
	@echo "$(GREEN)Deploying DAGs...$(NC)"
	@./scripts/deploy_dags.sh $(DAGS_DIR) --validate --backup

list-dags: ## List all DAGs
	@airflow dags list

list-tasks: ## List all tasks in a DAG (usage: make list-tasks DAG_ID=rul_training_pipeline)
	@airflow tasks list $(DAG_ID)

trigger: ## Trigger a DAG run (usage: make trigger DAG_ID=rul_training_pipeline)
	@echo "$(GREEN)Triggering DAG: $(DAG_ID)$(NC)"
	@airflow dags trigger $(DAG_ID)

pause: ## Pause a DAG (usage: make pause DAG_ID=rul_training_pipeline)
	@echo "$(GREEN)Pausing DAG: $(DAG_ID)$(NC)"
	@airflow dags pause $(DAG_ID)

unpause: ## Unpause a DAG (usage: make unpause DAG_ID=rul_training_pipeline)
	@echo "$(GREEN)Unpausing DAG: $(DAG_ID)$(NC)"
	@airflow dags unpause $(DAG_ID)

# ====================================================================================================
# Logging
# ====================================================================================================

logs: ## View scheduler logs
	@tail -f logs/scheduler/latest/*.log

logs-webserver: ## View webserver logs
	@tail -f logs/scheduler/latest/webserver*.log

logs-task: ## View task logs (usage: make logs-task DAG_ID=rul_training_pipeline TASK_ID=check_prerequisites DATE=2024-01-01)
	@airflow tasks logs $(DAG_ID) $(TASK_ID) $(DATE)

# ====================================================================================================
# Database Management
# ====================================================================================================

db-check: ## Check database connection
	@airflow db check

db-upgrade: ## Upgrade database schema
	@airflow db upgrade

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "$(YELLOW)WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		airflow db reset; \
	else \
		echo "Cancelled."; \
	fi

db-shell: ## Open database shell
	@airflow db shell

# ====================================================================================================
# User Management
# ====================================================================================================

create-user: ## Create a new user (interactive)
	@airflow users create

list-users: ## List all users
	@airflow users list

delete-user: ## Delete a user (usage: make delete-user USERNAME=testuser)
	@airflow users delete --username $(USERNAME)

# ====================================================================================================
# Variables and Connections
# ====================================================================================================

list-variables: ## List all Airflow variables
	@airflow variables list

set-variable: ## Set an Airflow variable (usage: make set-variable KEY=training_epochs VALUE=100)
	@airflow variables set $(KEY) $(VALUE)

get-variable: ## Get an Airflow variable (usage: make get-variable KEY=training_epochs)
	@airflow variables get $(KEY)

list-connections: ## List all Airflow connections
	@airflow connections list

# ====================================================================================================
# Testing
# ====================================================================================================

test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	@$(PYTHON) -m pytest tests/ -v

test-dags: ## Test DAG integrity
	@echo "$(GREEN)Testing DAG integrity...$(NC)"
	@./scripts/check_dags.sh

test-task: ## Test a specific task (usage: make test-task DAG_ID=rul_training_pipeline TASK_ID=check_prerequisites DATE=2024-01-01)
	@echo "$(GREEN)Testing task: $(DAG_ID).$(TASK_ID)$(NC)"
	@airflow tasks test $(DAG_ID) $(TASK_ID) $(DATE)

# ====================================================================================================
# Cleanup
# ====================================================================================================

clean: ## Clean temporary files and caches
	@echo "$(GREEN)Cleaning temporary files...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true
	@find . -type f -name "*.log" -delete 2>/dev/null || true
	@rm -rf .pytest_cache 2>/dev/null || true
	@rm -rf htmlcov 2>/dev/null || true
	@rm -rf .coverage 2>/dev/null || true
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-logs: ## Clean log files (older than 7 days)
	@echo "$(GREEN)Cleaning old log files...$(NC)"
	@find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
	@echo "$(GREEN)Old logs cleaned!$(NC)"

clean-all: clean clean-logs ## Clean everything

# ====================================================================================================
# Development
# ====================================================================================================

install: ## Install Python dependencies
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@pip install -r requirements.txt

install-dev: ## Install development dependencies
	@echo "$(GREEN)Installing development dependencies...$(NC)"
	@pip install -r requirements.txt
	@pip install pytest pytest-cov black flake8 pylint mypy

format: ## Format Python code with black
	@echo "$(GREEN)Formatting code...$(NC)"
	@black dags/ operators/ plugins/

lint: ## Lint Python code
	@echo "$(GREEN)Linting code...$(NC)"
	@flake8 dags/ operators/ plugins/ --max-line-length=100 --ignore=E501,W503

type-check: ## Run type checking with mypy
	@echo "$(GREEN)Type checking...$(NC)"
	@mypy dags/ operators/ plugins/ --ignore-missing-imports

quality: format lint type-check ## Run all code quality checks

# ====================================================================================================
# Monitoring
# ====================================================================================================

health-check: ## Check Airflow health
	@echo "$(GREEN)Checking Airflow health...$(NC)"
	@curl -s http://localhost:8080/health | jq '.' || echo "Webserver not responding"

metrics: ## Show basic metrics
	@echo "$(GREEN)Airflow Metrics$(NC)"
	@echo "DAGs: $$(airflow dags list | wc -l)"
	@echo "Active DAG runs: $$(airflow dags list-runs --state running | wc -l)"
	@echo "Failed tasks (last 24h): $$(find logs/ -name "*.log" -mtime -1 | xargs grep -l "ERROR" | wc -l)"

# ====================================================================================================
# Documentation
# ====================================================================================================

docs: ## Generate documentation
	@echo "$(GREEN)Generating documentation...$(NC)"
	@sphinx-build -b html docs/ docs/_build/

serve-docs: ## Serve documentation
	@echo "$(GREEN)Serving documentation at http://localhost:8000$(NC)"
	@cd docs/_build && python -m http.server 8000

# ====================================================================================================
# Backup
# ====================================================================================================

backup: ## Create backup of database and DAGs
	@echo "$(GREEN)Creating backup...$(NC)"
	@mkdir -p backups
	@BACKUP_DIR=backups/backup_$$(date +%Y%m%d_%H%M%S); \
	mkdir -p $$BACKUP_DIR; \
	cp -r dags/ $$BACKUP_DIR/; \
	cp airflow.db $$BACKUP_DIR/ 2>/dev/null || true; \
	echo "Backup created at: $$BACKUP_DIR"

# ====================================================================================================
# Info
# ====================================================================================================

info: ## Show environment information
	@echo "$(GREEN)=====================================================================================================$(NC)"
	@echo "$(GREEN)Environment Information$(NC)"
	@echo "$(GREEN)=====================================================================================================$(NC)"
	@echo "Airflow Home: $(AIRFLOW_HOME)"
	@echo "Project Root: $(PROJECT_ROOT)"
	@echo "Python: $$($(PYTHON) --version)"
	@echo "Airflow: $$(airflow version 2>/dev/null || echo 'Not installed')"
	@echo "Docker: $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker Compose: $$(docker-compose --version 2>/dev/null || echo 'Not installed')"
	@echo "$(GREEN)=====================================================================================================$(NC)"

version: ## Show Airflow version
	@airflow version
