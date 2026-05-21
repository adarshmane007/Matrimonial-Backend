# Deploy config (`envs.json`)

Edit `envs.json` with your AWS values before running the GitHub Action.

| Field | What to put |
|-------|-------------|
| `aws_region` | e.g. `ap-south-1` |
| `aws_account_id` | 12-digit AWS account ID |
| `ecr_repo_name` | ECR repository name |
| `ecs_cluster_name` | Your ECS cluster name |
| `ecs_service_name` | ECS service that runs the API |
| `ecs_container_name` | **Exact** container name in the task definition |
| `docker_platform` | `linux/amd64` (usual for ECS Fargate/EC2) |

## GitHub repository secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | IAM user/role key with ECR + ECS permissions |
| `AWS_SECRET_ACCESS_KEY` | Matching secret key |

## Run deploy

**Actions → Deploy Matrimonial API to ECS → Run workflow**

The workflow will:

1. Build the Docker image from `Dockerfile`
2. Push to ECR (`latest`, `1.0.<run>`, git SHA)
3. Copy the **current** running task definition
4. Replace only the container image
5. Register a **new revision** and update the ECS service

## ECS task definition env (unchanged by deploy)

Deploy only updates the **image**. Keep env vars in the task definition (or AWS console):

- `PORT=3001`, `HOST=0.0.0.0`, `NODE_ENV=production`
- `JWT_SECRET` (Secrets Manager recommended)
- `CORS_ORIGIN`, `DATABASE_PATH=/data/matrimonial.db`
- `SEED_ON_STARTUP=false`, `TRUST_PROXY=true`

See [DEPLOYMENT-ECS.md](../DEPLOYMENT-ECS.md).
