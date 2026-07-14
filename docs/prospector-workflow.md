# Prospector-cron (GitHub Action)

Dit workflow-bestand kon niet via een gewone PAT gepusht worden (vereist de
`workflow`-scope). Voeg het handmatig toe via **GitHub → Add file → Create new
file** met pad **`.github/workflows/prospector.yml`** en plak onderstaande inhoud.
Dat mag wél via de web-UI zonder extra token-scope.

Benodigde **Actions secrets** (repo → Settings → Secrets and variables → Actions):
`APP_BASE_URL`, `LEADS_INGEST_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

```yaml
name: Webshop-prospector (wekelijks)

on:
  schedule:
    - cron: "0 7 * * 1"
  workflow_dispatch: {}

jobs:
  prospect:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run prospector
        run: |
          if [ -f prospector/run.mjs ]; then
            node prospector/run.mjs > leads.json
          else
            echo '{"bron":"webshop-prospector","leads":[]}' > leads.json
          fi

      - name: POST naar /api/prospector
        env:
          BASE_URL: ${{ secrets.APP_BASE_URL }}
          INGEST_SECRET: ${{ secrets.LEADS_INGEST_SECRET }}
        run: |
          curl -sS -X POST "$BASE_URL/api/prospector" \
            -H "content-type: application/json" \
            -H "x-viesa-ingest-secret: $INGEST_SECRET" \
            --data-binary @leads.json

      - name: Supabase-ping
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          curl -sS "$SUPABASE_URL/rest/v1/prospector_runs?select=id&limit=1" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" > /dev/null
```
