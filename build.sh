#!/bin/bash
set -eo pipefail
UPDATE_CACHE=""
docker-compose -f docker-compose.yml build challenge-forum-processor
docker create --name app challenge-forum-processor:latest
