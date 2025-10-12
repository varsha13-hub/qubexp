#!/bin/bash

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"

echo "✅ SSL certificates generated successfully!"
echo "📁 Location: ./ssl/key.pem and ./ssl/cert.pem"
