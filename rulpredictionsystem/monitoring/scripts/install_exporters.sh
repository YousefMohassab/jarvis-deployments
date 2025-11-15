#!/bin/bash
# Install Monitoring Exporters
# This script installs all necessary exporters for the RUL monitoring stack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Installing Monitoring Exporters"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. Some exporters may not need root privileges."
    fi
}

# Install Node Exporter
install_node_exporter() {
    print_info "Installing Node Exporter..."

    NODE_EXPORTER_VERSION="1.6.1"
    DOWNLOAD_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"

    cd /tmp
    wget -q "$DOWNLOAD_URL" -O node_exporter.tar.gz

    tar -xzf node_exporter.tar.gz
    sudo mv node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter /usr/local/bin/
    sudo chmod +x /usr/local/bin/node_exporter

    rm -rf node_exporter*

    # Create systemd service
    sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/node_exporter \
    --collector.filesystem.mount-points-exclude='^/(sys|proc|dev|host|etc)($$|/)' \
    --collector.netclass.ignored-devices='^(veth.*|docker.*|lo)$$' \
    --collector.netdev.device-exclude='^(veth.*|docker.*|lo)$$'

[Install]
WantedBy=multi-user.target
EOF

    print_info "Node Exporter installed successfully"
}

# Install PostgreSQL Exporter
install_postgres_exporter() {
    print_info "Installing PostgreSQL Exporter..."

    POSTGRES_EXPORTER_VERSION="0.13.2"
    DOWNLOAD_URL="https://github.com/prometheus-community/postgres_exporter/releases/download/v${POSTGRES_EXPORTER_VERSION}/postgres_exporter-${POSTGRES_EXPORTER_VERSION}.linux-amd64.tar.gz"

    cd /tmp
    wget -q "$DOWNLOAD_URL" -O postgres_exporter.tar.gz

    tar -xzf postgres_exporter.tar.gz
    sudo mv postgres_exporter-${POSTGRES_EXPORTER_VERSION}.linux-amd64/postgres_exporter /usr/local/bin/
    sudo chmod +x /usr/local/bin/postgres_exporter

    rm -rf postgres_exporter*

    # Create systemd service
    sudo tee /etc/systemd/system/postgres_exporter.service > /dev/null <<EOF
[Unit]
Description=PostgreSQL Exporter
After=network.target

[Service]
User=prometheus
Group=prometheus
Type=simple
Environment="DATA_SOURCE_NAME=postgresql://postgres:postgres@localhost:5432/rul_db?sslmode=disable"
ExecStart=/usr/local/bin/postgres_exporter

[Install]
WantedBy=multi-user.target
EOF

    print_info "PostgreSQL Exporter installed successfully"
}

# Install Custom Model Exporter
install_model_exporter() {
    print_info "Installing Custom Model Exporter..."

    # Create virtual environment
    cd "$MONITORING_DIR"
    python3 -m venv venv
    source venv/bin/activate

    # Install dependencies
    pip install -q --upgrade pip
    pip install -q -r requirements.txt

    deactivate

    # Create systemd service
    sudo tee /etc/systemd/system/model_exporter.service > /dev/null <<EOF
[Unit]
Description=Model Metrics Exporter
After=network.target postgresql.service

[Service]
User=prometheus
Group=prometheus
Type=simple
WorkingDirectory=$MONITORING_DIR
Environment="DB_HOST=localhost"
Environment="DB_PORT=5432"
Environment="DB_NAME=rul_db"
Environment="DB_USER=postgres"
Environment="DB_PASSWORD=postgres"
Environment="EXPORTER_PORT=9090"
Environment="METRICS_INTERVAL=60"
ExecStart=$MONITORING_DIR/venv/bin/python -m exporters.model_exporter

[Install]
WantedBy=multi-user.target
EOF

    print_info "Model Exporter installed successfully"
}

# Create prometheus user
create_prometheus_user() {
    print_info "Creating prometheus user..."

    if id "prometheus" &>/dev/null; then
        print_warning "User 'prometheus' already exists"
    else
        sudo useradd --no-create-home --shell /bin/false prometheus
        print_info "User 'prometheus' created"
    fi
}

# Start services
start_services() {
    print_info "Starting services..."

    sudo systemctl daemon-reload

    # Start and enable Node Exporter
    sudo systemctl enable node_exporter
    sudo systemctl start node_exporter

    # Start and enable PostgreSQL Exporter
    sudo systemctl enable postgres_exporter
    sudo systemctl start postgres_exporter

    # Start and enable Model Exporter
    sudo systemctl enable model_exporter
    sudo systemctl start model_exporter

    print_info "All services started and enabled"
}

# Check services status
check_services() {
    print_info "Checking services status..."

    echo ""
    echo "Node Exporter:"
    sudo systemctl status node_exporter --no-pager | grep Active || true

    echo ""
    echo "PostgreSQL Exporter:"
    sudo systemctl status postgres_exporter --no-pager | grep Active || true

    echo ""
    echo "Model Exporter:"
    sudo systemctl status model_exporter --no-pager | grep Active || true

    echo ""
    print_info "Service endpoints:"
    echo "  - Node Exporter: http://localhost:9100/metrics"
    echo "  - PostgreSQL Exporter: http://localhost:9187/metrics"
    echo "  - Model Exporter: http://localhost:9090/metrics"
}

# Main installation
main() {
    check_root

    # Install exporters
    create_prometheus_user
    install_node_exporter
    install_postgres_exporter
    install_model_exporter

    # Start services
    start_services

    # Check status
    check_services

    echo ""
    print_info "Installation completed successfully!"
    print_info "You can now start Prometheus and Grafana using docker-compose"
    echo ""
    echo "  cd $MONITORING_DIR"
    echo "  docker-compose -f docker-compose.monitoring.yml up -d"
    echo ""
}

# Run main function
main "$@"
