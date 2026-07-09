#!/usr/bin/env python3
import http.server
import ssl
import socketserver
import os

# Create a simple self-signed certificate for local development
def create_self_signed_cert():
    try:
        import subprocess
        
        # Check if openssl is available
        subprocess.run(['openssl', 'version'], check=True, capture_output=True)
        
        # Generate private key
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:4096', '-keyout', 'key.pem', 
            '-out', 'cert.pem', '-days', '365', '-nodes', '-subj', 
            '/C=US/ST=State/L=City/O=Organization/CN=localhost'
        ], check=True, capture_output=True)
        
        print("✅ Self-signed certificate created successfully!")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ OpenSSL not found. Creating a simple certificate...")
        return False

# Create certificate if it doesn't exist
if not os.path.exists('cert.pem') or not os.path.exists('key.pem'):
    create_self_signed_cert()

# Set up HTTPS server
PORT = 8443
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    # Wrap the socket with SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    
    if os.path.exists('cert.pem') and os.path.exists('key.pem'):
        context.load_cert_chain('cert.pem', 'key.pem')
        print(f"🔒 HTTPS Server running at https://localhost:{PORT}/")
        print(f"🔒 HTTPS Server running at https://127.0.0.1:{PORT}/")
        print("⚠️  Your browser will show a security warning - click 'Advanced' and 'Proceed to localhost'")
    else:
        print("❌ Certificate files not found. Please install OpenSSL or run:")
        print("   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes")
        exit(1)
    
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")
