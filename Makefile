# Makefile — shortcuts for common tasks. See docs/setup_appliance.md and
# docs/setup_saas.md for full walkthroughs.

.PHONY: up down logs seed-users test-ingest saas-up saas-down cert

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

# Create demo users (admin/viewer for both tenants) with real bcrypt hashes.
# Run this AFTER `make up` (needs the api container's deps, so it runs
# inside the container to avoid requiring a local Node install).
seed-users:
	docker compose exec api node backend/scripts/create_user.js --email admin@demoA.local --password secret123 --role admin --tenant demoA
	docker compose exec api node backend/scripts/create_user.js --email viewer@demoA.local --password secret123 --role viewer --tenant demoA
	docker compose exec api node backend/scripts/create_user.js --email admin@demoB.local --password secret123 --role admin --tenant demoB

# Sends sample syslog + posts sample JSON logs — see samples/README.md
test-ingest:
	./samples/send_syslog.sh udp 127.0.0.1 514
	python3 ./samples/post_logs.py --url http://localhost:3000/ingest

cert:
	./deploy/certs/gen-cert.sh $(CN)

saas-up:
	docker compose -f docker-compose.yml -f docker-compose.saas.yml up -d --build

saas-down:
	docker compose -f docker-compose.yml -f docker-compose.saas.yml down