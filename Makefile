.PHONY: up down re certs clean

# Generate dev TLS certs (if missing) then start all services.
up: certs
	docker compose up --build

down:
	docker compose down

re: down up

# Generate self-signed certs for local HTTPS/WSS (dev only).
certs:
	sh scripts/gen-certs.sh

# Stop and remove containers + volumes, and drop generated certs.
clean:
	docker compose down -v
	rm -rf certs
