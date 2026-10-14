#!/bin/sh
# Nahraje kód do Apps Scriptu a nasadí novou verzi do stávajícího nasazení (odkaz …/exec se nemění).
# Použití: scripts/nasadit_apps_script.sh "popis změny"
set -e
cd "$(dirname "$0")/.."
NASAZENI=AKfycbzkQV-t3BtJbfYflq9wdiGLkkmVxLhUNiZBS1x2lsgr7tYF4n2SOp1dX5bj7ePgQQ6gSw
clasp push --force
clasp create-deployment --deploymentId "$NASAZENI" --description "${1:-Aktualizace}"
