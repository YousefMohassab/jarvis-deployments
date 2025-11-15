#!/bin/bash
# ============================================================================
# Generate Self-Signed SSL Certificates
# For development and testing purposes only
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSL_DIR="docker/nginx/ssl"
DOMAIN=${DOMAIN:-"localhost"}
DAYS=${DAYS:-365}
KEY_SIZE=${KEY_SIZE:-2048}

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}SSL Certificate Generator${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo "Domain: ${DOMAIN}"
echo "Validity: ${DAYS} days"
echo "Key size: ${KEY_SIZE} bits"
echo ""

echo -e "${YELLOW}WARNING: This generates self-signed certificates for development only.${NC}"
echo -e "${YELLOW}For production, use proper CA-signed certificates (Let's Encrypt, etc.)${NC}"
echo ""

# Create SSL directory
mkdir -p "${SSL_DIR}"

echo -e "${YELLOW}Generating private key...${NC}"

# Generate private key
openssl genrsa -out "${SSL_DIR}/key.pem" ${KEY_SIZE}

echo -e "${GREEN}✓ Private key generated${NC}\n"

echo -e "${YELLOW}Generating certificate signing request...${NC}"

# Generate CSR
openssl req -new \
    -key "${SSL_DIR}/key.pem" \
    -out "${SSL_DIR}/csr.pem" \
    -subj "/C=US/ST=State/L=City/O=RUL Prediction/OU=IT/CN=${DOMAIN}"

echo -e "${GREEN}✓ CSR generated${NC}\n"

echo -e "${YELLOW}Generating self-signed certificate...${NC}"

# Generate self-signed certificate
openssl x509 -req \
    -days ${DAYS} \
    -in "${SSL_DIR}/csr.pem" \
    -signkey "${SSL_DIR}/key.pem" \
    -out "${SSL_DIR}/cert.pem" \
    -extfile <(printf "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN},DNS:localhost,IP:127.0.0.1")

echo -e "${GREEN}✓ Certificate generated${NC}\n"

# Set permissions
chmod 600 "${SSL_DIR}/key.pem"
chmod 644 "${SSL_DIR}/cert.pem"

# Remove CSR (no longer needed)
rm -f "${SSL_DIR}/csr.pem"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Certificate Information${NC}"
echo -e "${BLUE}============================================================================${NC}"

# Display certificate information
openssl x509 -in "${SSL_DIR}/cert.pem" -text -noout | grep -A 2 "Subject:"
openssl x509 -in "${SSL_DIR}/cert.pem" -text -noout | grep -A 2 "Validity"
openssl x509 -in "${SSL_DIR}/cert.pem" -text -noout | grep "Subject Alternative Name" -A 1

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Files Created${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo "Private key: ${SSL_DIR}/key.pem"
echo "Certificate: ${SSL_DIR}/cert.pem"

echo ""
echo -e "${GREEN}✓ SSL certificates generated successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update docker-compose.yml to enable HTTPS"
echo "  2. Update nginx configuration to use SSL"
echo "  3. Trust the certificate in your browser (for development)"
echo ""
echo "To trust certificate in browser:"
echo "  - Chrome: Settings > Privacy > Manage certificates"
echo "  - Firefox: Settings > Privacy > View Certificates"
echo "  - Safari: Keychain Access > Import certificate"
echo ""
echo -e "${YELLOW}Note: Browsers will still show warnings for self-signed certificates.${NC}"
echo -e "${YELLOW}For production, use Let's Encrypt: certbot --nginx${NC}"

exit 0
