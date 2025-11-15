# Makefile for RUL Monitoring Stack
# Convenient commands for managing the monitoring infrastructure

.PHONY: help start stop restart status logs clean backup restore install update health

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m

help: ## Show this help message
	@echo "$(BLUE)RUL Monitoring Stack - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

start: ## Start all monitoring services
	@echo "$(BLUE)Starting monitoring stack...$(NC)"
	docker-compose -f docker-compose.monitoring.yml up -d
	@echo "$(GREEN)Monitoring stack started!$(NC)"
	@echo "Access points:"
	@echo "  - Prometheus: http://localhost:9090"
	@echo "  - Grafana: http://localhost:3000 (admin/admin123)"
	@echo "  - AlertManager: http://localhost:9093"

stop: ## Stop all monitoring services
	@echo "$(BLUE)Stopping monitoring stack...$(NC)"
	docker-compose -f docker-compose.monitoring.yml down
	@echo "$(GREEN)Monitoring stack stopped!$(NC)"

restart: ## Restart all monitoring services
	@echo "$(BLUE)Restarting monitoring stack...$(NC)"
	docker-compose -f docker-compose.monitoring.yml restart
	@echo "$(GREEN)Monitoring stack restarted!$(NC)"

status: ## Show status of all services
	@echo "$(BLUE)Monitoring stack status:$(NC)"
	@docker-compose -f docker-compose.monitoring.yml ps

logs: ## Show logs from all services
	docker-compose -f docker-compose.monitoring.yml logs -f

logs-prometheus: ## Show Prometheus logs
	docker logs -f rul-prometheus

logs-grafana: ## Show Grafana logs
	docker logs -f rul-grafana

logs-alertmanager: ## Show AlertManager logs
	docker logs -f rul-alertmanager

clean: ## Remove all containers and volumes
	@echo "$(RED)This will remove all monitoring data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.monitoring.yml down -v; \
		echo "$(GREEN)Monitoring stack cleaned!$(NC)"; \
	fi

backup: ## Backup Grafana dashboards and config
	@echo "$(BLUE)Backing up Grafana...$(NC)"
	./scripts/backup_grafana.sh
	@echo "$(GREEN)Backup completed!$(NC)"

restore: ## Restore Grafana from backup
	@echo "$(BLUE)Available backups:$(NC)"
	@./scripts/restore_grafana.sh --list
	@read -p "Enter backup file path: " backup_file; \
	./scripts/restore_grafana.sh $$backup_file

install: ## Install exporters
	@echo "$(BLUE)Installing exporters...$(NC)"
	sudo ./scripts/install_exporters.sh
	@echo "$(GREEN)Exporters installed!$(NC)"

update: ## Update all Docker images
	@echo "$(BLUE)Updating Docker images...$(NC)"
	docker-compose -f docker-compose.monitoring.yml pull
	@echo "$(GREEN)Images updated!$(NC)"
	@echo "Run 'make restart' to use new images"

health: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@echo ""
	@echo "Prometheus:"
	@curl -s http://localhost:9090/-/healthy && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "Grafana:"
	@curl -s http://localhost:3000/api/health | jq -r '.database' && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "AlertManager:"
	@curl -s http://localhost:9093/-/healthy && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "Node Exporter:"
	@curl -s http://localhost:9100/metrics > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"
	@echo ""
	@echo "PostgreSQL Exporter:"
	@curl -s http://localhost:9187/metrics > /dev/null && echo "$(GREEN)✓ Healthy$(NC)" || echo "$(RED)✗ Unhealthy$(NC)"

targets: ## Show Prometheus targets status
	@echo "$(BLUE)Prometheus targets:$(NC)"
	@curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, instance: .labels.instance, health: .health}'

alerts: ## Show active alerts
	@echo "$(BLUE)Active alerts:$(NC)"
	@curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | {name: .labels.alertname, state: .state, value: .value}'

rules: ## Show alert rules status
	@echo "$(BLUE)Alert rules:$(NC)"
	@curl -s http://localhost:9090/api/v1/rules | jq '.data.groups[] | {name: .name, rules: .rules | length}'

dashboards: ## List Grafana dashboards
	@echo "$(BLUE)Grafana dashboards:$(NC)"
	@curl -s -u admin:admin123 http://localhost:3000/api/search?type=dash-db | jq '.[] | {title: .title, url: .url}'

test-alert: ## Send test alert
	@echo "$(BLUE)Sending test alert...$(NC)"
	@curl -X POST http://localhost:9093/api/v1/alerts -d '[{"labels":{"alertname":"TestAlert","severity":"warning"},"annotations":{"summary":"Test alert from Makefile"}}]'
	@echo ""
	@echo "$(GREEN)Test alert sent!$(NC)"

validate-prometheus: ## Validate Prometheus config
	@echo "$(BLUE)Validating Prometheus configuration...$(NC)"
	docker run --rm -v $(PWD)/prometheus:/etc/prometheus prom/prometheus:latest promtool check config /etc/prometheus/prometheus.yml

validate-alertmanager: ## Validate AlertManager config
	@echo "$(BLUE)Validating AlertManager configuration...$(NC)"
	docker run --rm -v $(PWD)/alertmanager:/etc/alertmanager prom/alertmanager:latest amtool check-config /etc/alertmanager/alertmanager.yml

dev: start ## Start in development mode
	@echo "$(GREEN)Monitoring stack started in development mode$(NC)"

prod: ## Start in production mode
	@echo "$(BLUE)Starting in production mode...$(NC)"
	docker-compose -f docker-compose.monitoring.yml -f docker-compose.prod.yml up -d
	@echo "$(GREEN)Production mode started!$(NC)"

shell-prometheus: ## Open shell in Prometheus container
	docker exec -it rul-prometheus sh

shell-grafana: ## Open shell in Grafana container
	docker exec -it rul-grafana sh

shell-alertmanager: ## Open shell in AlertManager container
	docker exec -it rul-alertmanager sh
