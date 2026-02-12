# Deployment Guide (Vercel)

## 1. Upload project
- Push this folder to a Git repo (GitHub/GitLab/Bitbucket), or import local folder in Vercel CLI.

## 2. Create Vercel project
- In Vercel dashboard: `Add New -> Project`.
- Import your repo.
- Framework preset can stay as `Other`.

## 3. Set environment variables
- In project settings -> `Environment Variables`, add:
- `AI_API_KEY` (required): your chat model key.
- `AI_BASE_URL` (optional): default `https://api.deepseek.com/v1/chat/completions`.
- `AI_CHAT_MODEL` (optional): default `deepseek-chat`.
- `AI_MAX_TOKENS` (optional): default `2000`.
- `AI_IMAGE_API_KEY` (optional): image model key (if omitted, uses `AI_API_KEY`).
- `AI_IMAGE_BASE_URL` (optional): default `https://open.bigmodel.cn/api/paas/v4/images/generations`.
- `AI_IMAGE_MODEL` (optional): default `cogview-3-flash`.

## 4. Deploy
- Click `Deploy`.
- After deployment, open your domain like `https://your-project.vercel.app`.

## 5. Verify
- Open `https://your-project.vercel.app/api/health`.
- You should see JSON with `ok: true`.
- Then test normal page usage on desktop and mobile browsers.

## Notes
- API keys are now server-side only, not stored in browser localStorage.
- Frontend calls same-origin endpoints: `/api/chat`, `/api/image`, `/api/health`.
