#!/usr/bin/env bash
# 마이그레이션 + 시드 + 서버 시나리오 테스트를 로컬 Supabase 에 한 번에 돌린다.
#   npm run db:test
# 로컬에 psql 이 없어도 되도록 DB 컨테이너 안의 psql 을 쓴다.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_ID=$(sed -n 's/^project_id *= *"\(.*\)"/\1/p' supabase/config.toml)
DB_CONTAINER="supabase_db_${PROJECT_ID}"

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "로컬 Supabase 가 떠 있지 않습니다. 먼저 npm run db:start 를 실행하세요." >&2
  exit 1
fi

echo "▸ 데이터베이스 초기화 (마이그레이션 + seed.sql)"
npx supabase db reset >/dev/null

echo "▸ 서버 시나리오 테스트"
docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q \
  < scripts/test.sql 2>&1 | grep -E 'PASS|FAIL|ERROR|──|모든' | sed 's/^psql:[^ ]* *//'
