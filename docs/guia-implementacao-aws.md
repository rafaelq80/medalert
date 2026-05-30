# Guia de Implementação — MedAlert Backend na AWS (Free Tier 2026)

**Baseado em:** `docs/aws-architecture.md`
**Objetivo:** Deploy do backend MedAlert na AWS gastando $0 usando o Free Tier atual.

---

## Contexto: AWS Free Tier (pós-julho 2025)

A AWS reformulou o Free Tier em julho de 2025. O modelo atual oferece:

- **$100 em créditos** ao criar a conta (imediatos)
- **+$100 em créditos** ao completar atividades com serviços (EC2, Bedrock, etc.)
- **Plano Free** válido por 6 meses (sem cobrança além dos créditos)
- **30+ serviços Always Free** com limites mensais permanentes
- **Aurora PostgreSQL Serverless** disponível no Free Plan (até 4 ACUs + 1 GiB storage)

---

## Arquitetura Adaptada para Free Tier

A arquitetura de produção (`aws-architecture.md`) usa ECS Fargate + Aurora Serverless v2 (~$99/mês).
Para Free Tier, adaptamos para maximizar serviços gratuitos:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Cloud (us-east-1)                          │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │ CloudFront   │───▶│  EC2 t3.micro (FastAPI + Nginx)      │   │
│  │ (Always Free)│    │  ou App Runner (créditos)            │   │
│  └──────────────┘    └──────────────┬───────────────────────┘   │
│                                      │                           │
│                         ┌────────────▼────────────────┐         │
│                         │  Aurora Serverless v2        │         │
│                         │  PostgreSQL (Free Plan)      │         │
│                         │  Até 4 ACUs + 1 GiB storage  │         │
│                         └─────────────────────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Scheduler: EventBridge + Lambda (Always Free)            │   │
│  │  Push: SNS (1M publishes/mês grátis)                      │   │
│  │  Secrets: Secrets Manager (créditos)                       │   │
│  │  Logs: CloudWatch (5 GB ingest + 10 metrics grátis)       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```


## Serviços e Limites Free Tier Utilizados

| Serviço | Tipo | Limite Gratuito | Uso no MedAlert |
|---------|------|-----------------|-----------------|
| **Aurora Serverless v2** | Free Plan | 4 ACUs + 1 GiB storage | Banco PostgreSQL principal |
| **EC2 t3.micro** | Créditos ($200) | 750h/mês (coberto por créditos) | FastAPI container |
| **Lambda** | Always Free | 1M requests + 400K GB-s/mês | 4 jobs do scheduler |
| **EventBridge** | Always Free | 14M eventos/mês | Triggers dos jobs |
| **CloudFront** | Always Free | 1 TB out + 10M requests/mês | CDN + HTTPS |
| **SNS** | Always Free | 1M publishes/mês | Push notifications |
| **CloudWatch** | Always Free | 5 GB logs + 10 metrics + 10 alarms | Monitoramento |
| **Secrets Manager** | Créditos | ~$0.40/secret/mês (coberto) | JWT, DB credentials |
| **S3** | Always Free | 5 GB Standard | Backups, assets |
| **ECR** | Free Plan | 50 GB storage | Imagens Docker |

---

## Pré-requisitos

1. **Conta AWS** criada após julho 2025 (para ter o novo Free Plan)
2. **AWS CLI v2** instalado e configurado
3. **Docker** instalado (para build da imagem)
4. **Python 3.12** (para CDK e Lambdas)
5. **Node.js 18+** (para AWS CDK CLI)

```bash
# Instalar AWS CLI
winget install Amazon.AWSCLI

# Instalar CDK CLI
npm install -g aws-cdk

# Configurar credenciais
aws configure
# AWS Access Key ID: [sua-key]
# AWS Secret Access Key: [sua-secret]
# Default region: us-east-1
# Default output format: json
```


---

## Passo 1: Preparar o Backend para Deploy

### 1.1 Criar Dockerfile

Crie `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Expor porta
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Iniciar com Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### 1.2 Criar endpoint /health

Adicione ao `backend/app/main.py` (se não existir):

```python
@app.get("/health", include_in_schema=False)
async def health_check():
    return {"status": "healthy"}
```


### 1.3 Configurar variáveis de ambiente para produção

Crie `backend/.env.production`:

```env
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<aurora-endpoint>:5432/medalert
SECRET_KEY=<gerado-pelo-secrets-manager>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
TIMEZONE=America/Sao_Paulo
FCM_SERVER_KEY=<sua-chave-fcm>
```

> Essas variáveis serão injetadas via Secrets Manager em produção — nunca commitar no git.

---

## Passo 2: Criar o Banco de Dados (Aurora Serverless v2)

O Aurora PostgreSQL Serverless está disponível no Free Plan com até 4 ACUs e 1 GiB de storage — suficiente para o MedAlert em fase inicial.

### 2.1 Criar via Console AWS

1. Acesse **RDS** → **Create database**
2. Selecione:
   - Engine: **Amazon Aurora**
   - Edition: **Aurora (PostgreSQL Compatible)**
   - Version: **PostgreSQL 15.x**
   - Template: **Dev/Test**
   - DB cluster identifier: `medalert-db`
   - Master username: `medalert_admin`
   - Master password: (gere uma senha forte)
3. Instance configuration:
   - **Serverless v2**
   - Minimum ACUs: `0.5`
   - Maximum ACUs: `4`
4. Connectivity:
   - VPC: Default VPC (para simplificar no Free Tier)
   - Public access: **No** (acesso apenas via EC2/Lambda na mesma VPC)
   - Security group: criar `medalert-db-sg`
5. Database name: `medalert`
6. Clique **Create database**


### 2.2 Criar via AWS CLI

```bash
# Criar security group para o banco
aws ec2 create-security-group \
  --group-name medalert-db-sg \
  --description "Security group for MedAlert Aurora DB"

# Criar o cluster Aurora Serverless v2
aws rds create-db-cluster \
  --db-cluster-identifier medalert-db \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username medalert_admin \
  --master-user-password "SuaSenhaForte123!" \
  --database-name medalert \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=4 \
  --vpc-security-group-ids sg-xxxxxxxx \
  --storage-encrypted

# Criar a instância writer
aws rds create-db-instance \
  --db-instance-identifier medalert-db-writer \
  --db-cluster-identifier medalert-db \
  --engine aurora-postgresql \
  --db-instance-class db.serverless
```

### 2.3 Obter o endpoint de conexão

```bash
aws rds describe-db-clusters \
  --db-cluster-identifier medalert-db \
  --query "DBClusters[0].Endpoint" \
  --output text
```

O endpoint será algo como: `medalert-db.cluster-xxxx.us-east-1.rds.amazonaws.com`

---

## Passo 3: Deploy do Backend (Opção A — EC2 t3.micro)

Abordagem mais simples e coberta pelos $200 em créditos.


### 3.1 Criar instância EC2

```bash
# Criar security group
aws ec2 create-security-group \
  --group-name medalert-api-sg \
  --description "Security group for MedAlert API"

# Permitir SSH e HTTP/HTTPS
aws ec2 authorize-security-group-ingress \
  --group-name medalert-api-sg \
  --protocol tcp --port 22 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name medalert-api-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name medalert-api-sg \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Criar key pair
aws ec2 create-key-pair \
  --key-name medalert-key \
  --query "KeyMaterial" \
  --output text > medalert-key.pem

# Lançar instância (Amazon Linux 2023, t3.micro)
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name medalert-key \
  --security-groups medalert-api-sg \
  --count 1 \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=medalert-api}]"
```

### 3.2 Configurar a instância EC2

Conecte via SSH e instale as dependências:

```bash
# Conectar
ssh -i medalert-key.pem ec2-user@<IP-PUBLICO>

# Atualizar sistema
sudo dnf update -y

# Instalar Docker
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx (reverse proxy + HTTPS)
sudo dnf install -y nginx
sudo systemctl enable nginx
```


### 3.3 Criar docker-compose.yml na EC2

```yaml
# /home/ec2-user/medalert/docker-compose.yml
version: "3.8"
services:
  api:
    build: ./backend
    container_name: medalert-api
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://medalert_admin:SuaSenha@medalert-db.cluster-xxxx.us-east-1.rds.amazonaws.com:5432/medalert
      - SECRET_KEY=${SECRET_KEY}
      - ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=1440
      - REFRESH_TOKEN_EXPIRE_DAYS=30
      - TIMEZONE=America/Sao_Paulo
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### 3.4 Configurar Nginx como reverse proxy

```nginx
# /etc/nginx/conf.d/medalert.conf
server {
    listen 80;
    server_name api.medalert.com.br;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}
```

### 3.5 HTTPS com Let's Encrypt (gratuito)

```bash
# Instalar Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Gerar certificado SSL
sudo certbot --nginx -d api.medalert.com.br --non-interactive --agree-tos -m seu@email.com

# Renovação automática (cron)
echo "0 0 1 * * certbot renew --quiet" | sudo crontab -
```


### 3.6 Deploy e iniciar

```bash
# Clonar repositório na EC2
git clone https://github.com/seu-usuario/medalert.git
cd medalert

# Build e iniciar
docker-compose up -d --build

# Executar migrações
docker exec medalert-api alembic upgrade head

# Verificar
curl http://localhost:8000/health
# {"status": "healthy"}
```

### 3.7 Permitir EC2 acessar Aurora

Adicione o security group da EC2 como regra de entrada no security group do Aurora:

```bash
# Permitir EC2 → Aurora na porta 5432
aws ec2 authorize-security-group-ingress \
  --group-id sg-AURORA-SG-ID \
  --protocol tcp \
  --port 5432 \
  --source-group sg-EC2-SG-ID
```

---

## Passo 3 (Opção B): Deploy com App Runner

Alternativa serverless mais simples (sem gerenciar EC2). Coberto pelos créditos.

```bash
# Criar repositório ECR
aws ecr create-repository --repository-name medalert-api

# Login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build e push da imagem
docker build -t medalert-api ./backend
docker tag medalert-api:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/medalert-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/medalert-api:latest

# Criar serviço App Runner via Console:
# 1. Acesse App Runner → Create service
# 2. Source: Container registry → Amazon ECR
# 3. Image: medalert-api:latest
# 4. CPU: 0.25 vCPU, Memory: 0.5 GB
# 5. Port: 8000
# 6. Environment variables: (configurar DATABASE_URL, SECRET_KEY, etc.)
# 7. Auto-deploy: Yes
```

> App Runner custa ~$5/mês para workloads mínimos, coberto pelos $200 em créditos.


---

## Passo 4: Configurar Scheduler (EventBridge + Lambda)

Os 4 jobs do APScheduler serão migrados para Lambda + EventBridge (Always Free).

### 4.1 Estrutura das Lambdas

```
infra/functions/
├── layer/
│   └── python/
│       └── requirements.txt    # sqlalchemy, asyncpg, httpx
├── gerar_registros/
│   └── handler.py
├── verificar_atrasos/
│   └── handler.py
├── marcar_ignorados/
│   └── handler.py
└── alertas_retorno/
    └── handler.py
```

### 4.2 Exemplo: Lambda gerar_registros

```python
# infra/functions/gerar_registros/handler.py
import asyncio
import json
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Importar models (via layer)
# DATABASE_URL vem de variável de ambiente

def lambda_handler(event, context):
    """Wrapper síncrono para o handler async."""
    result = asyncio.get_event_loop().run_until_complete(_async_handler())
    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }

async def _async_handler():
    """Lógica principal — mesma do job_gerar_registros_tomada."""
    import os
    from app.scheduler.jobs import job_gerar_registros_tomada

    # Reutiliza a lógica existente do backend
    await job_gerar_registros_tomada()
    return {"message": "Job executado com sucesso"}
```


### 4.3 Criar Lambdas via CLI

```bash
# Criar role de execução para Lambda
aws iam create-role \
  --role-name medalert-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Anexar políticas necessárias
aws iam attach-role-policy \
  --role-name medalert-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole

aws iam attach-role-policy \
  --role-name medalert-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Empacotar e criar cada Lambda
cd infra/functions/gerar_registros
zip -r function.zip .

aws lambda create-function \
  --function-name medalert-gerar-registros \
  --runtime python3.12 \
  --handler handler.lambda_handler \
  --role arn:aws:iam::<ACCOUNT_ID>:role/medalert-lambda-role \
  --zip-file fileb://function.zip \
  --timeout 60 \
  --memory-size 256 \
  --environment "Variables={DATABASE_URL=postgresql+asyncpg://...}"
```

### 4.4 Criar regras EventBridge

```bash
# Job: gerar registros (a cada 5 minutos)
aws events put-rule \
  --name medalert-gerar-registros \
  --schedule-expression "rate(5 minutes)"

aws events put-targets \
  --rule medalert-gerar-registros \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:medalert-gerar-registros"

# Job: verificar atrasos (a cada 2 minutos)
aws events put-rule \
  --name medalert-verificar-atrasos \
  --schedule-expression "rate(2 minutes)"

aws events put-targets \
  --rule medalert-verificar-atrasos \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:medalert-verificar-atrasos"

# Job: marcar ignorados (a cada 5 minutos)
aws events put-rule \
  --name medalert-marcar-ignorados \
  --schedule-expression "rate(5 minutes)"

aws events put-targets \
  --rule medalert-marcar-ignorados \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:medalert-marcar-ignorados"

# Job: alertas retorno médico (diário às 06:00 UTC)
aws events put-rule \
  --name medalert-alertas-retorno \
  --schedule-expression "cron(0 6 * * ? *)"

aws events put-targets \
  --rule medalert-alertas-retorno \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:medalert-alertas-retorno"
```


### 4.5 Cálculo de invocações Lambda (Free Tier)

| Job | Frequência | Invocações/mês | Duração estimada |
|-----|-----------|----------------|------------------|
| gerar_registros | 5 min | 8.640 | ~2s |
| verificar_atrasos | 2 min | 21.600 | ~1s |
| marcar_ignorados | 5 min | 8.640 | ~1s |
| alertas_retorno | 1x/dia | 30 | ~3s |
| **Total** | | **~38.910** | |

**Free Tier Lambda:** 1.000.000 requests + 400.000 GB-seconds/mês.
**Uso MedAlert:** ~39K requests + ~20K GB-seconds → **bem dentro do limite gratuito**.

---

## Passo 5: Configurar Push Notifications (SNS)

### 5.1 Criar Platform Application no SNS

```bash
# Para Android (FCM)
aws sns create-platform-application \
  --name medalert-fcm \
  --platform GCM \
  --attributes PlatformCredential=<FCM_SERVER_KEY>

# Para iOS (APNs) — requer certificado .p12
aws sns create-platform-application \
  --name medalert-apns \
  --platform APNS \
  --attributes PlatformCredential=<APNS_PRIVATE_KEY>,PlatformPrincipal=<APNS_CERTIFICATE>
```

### 5.2 Registrar device token (no backend)

Quando o mobile envia o push_token via `PUT /usuarios/me/push-token`, o backend registra no SNS:

```python
import boto3

sns_client = boto3.client("sns", region_name="us-east-1")

async def register_device(push_token: str, platform: str = "android"):
    platform_arn = (
        "arn:aws:sns:us-east-1:<ACCOUNT>:app/GCM/medalert-fcm"
        if platform == "android"
        else "arn:aws:sns:us-east-1:<ACCOUNT>:app/APNS/medalert-apns"
    )
    response = sns_client.create_platform_endpoint(
        PlatformApplicationArn=platform_arn,
        Token=push_token,
    )
    return response["EndpointArn"]
```

**Free Tier SNS:** 1.000.000 publishes/mês → mais que suficiente para o MedAlert.


---

## Passo 6: Configurar Secrets Manager

```bash
# Criar secret para credenciais do banco
aws secretsmanager create-secret \
  --name medalert/database \
  --secret-string '{"username":"medalert_admin","password":"SuaSenhaForte123!","host":"medalert-db.cluster-xxxx.us-east-1.rds.amazonaws.com","port":"5432","dbname":"medalert"}'

# Criar secret para JWT
aws secretsmanager create-secret \
  --name medalert/jwt \
  --secret-string '{"secret_key":"sua-chave-jwt-super-secreta-gerada-aleatoriamente"}'

# Criar secret para FCM
aws secretsmanager create-secret \
  --name medalert/fcm \
  --secret-string '{"server_key":"sua-chave-fcm"}'
```

> Secrets Manager custa ~$0.40/secret/mês — com 3 secrets = ~$1.20/mês, coberto pelos créditos.

---

## Passo 7: Configurar CloudFront (CDN + HTTPS)

CloudFront é Always Free (1 TB transfer + 10M requests/mês).

### 7.1 Criar distribuição apontando para EC2/App Runner

```bash
# Via Console AWS (mais simples para primeira vez):
# 1. CloudFront → Create distribution
# 2. Origin domain: <IP-EC2> ou <URL-APP-RUNNER>
# 3. Protocol: HTTPS only
# 4. Viewer protocol policy: Redirect HTTP to HTTPS
# 5. Cache policy: CachingDisabled (API não deve ser cacheada)
# 6. Alternate domain: api.medalert.com.br
# 7. SSL certificate: Request via ACM (gratuito)
```

### 7.2 Solicitar certificado SSL (ACM — gratuito)

```bash
aws acm request-certificate \
  --domain-name api.medalert.com.br \
  --validation-method DNS \
  --region us-east-1
```

Valide o certificado adicionando o registro CNAME no seu DNS.

---

## Passo 8: Configurar Monitoramento (CloudWatch)

### 8.1 Alarmes básicos (Free Tier: 10 alarmes)

```bash
# Alarme: EC2 CPU > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name medalert-high-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=InstanceId,Value=i-xxxxxxxx \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT>:medalert-alarms

# Alarme: Aurora connections > 80%
aws cloudwatch put-metric-alarm \
  --alarm-name medalert-db-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 40 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBClusterIdentifier,Value=medalert-db \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT>:medalert-alarms

# Alarme: Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name medalert-lambda-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT>:medalert-alarms
```


### 8.2 Criar tópico SNS para alarmes

```bash
# Criar tópico
aws sns create-topic --name medalert-alarms

# Inscrever seu email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:<ACCOUNT>:medalert-alarms \
  --protocol email \
  --notification-endpoint seu@email.com
```

---

## Passo 9: Executar Migrações do Banco

Após o Aurora estar rodando e a EC2 conectada:

```bash
# Na EC2, dentro do container
docker exec -it medalert-api alembic upgrade head
```

Ou via SSH direto (se Python estiver instalado na EC2):

```bash
# Instalar dependências localmente
pip install -r backend/requirements.txt

# Executar migrações
cd backend
DATABASE_URL="postgresql+asyncpg://medalert_admin:SuaSenha@medalert-db.cluster-xxxx.us-east-1.rds.amazonaws.com:5432/medalert" \
  alembic upgrade head
```

---

## Passo 10: Configurar DNS

Se você tem um domínio, aponte para o CloudFront:

```bash
# Criar hosted zone no Route 53 (se usar Route 53)
aws route53 create-hosted-zone \
  --name medalert.com.br \
  --caller-reference $(date +%s)

# Criar registro A (alias para CloudFront)
# Via Console: Route 53 → Hosted zones → Create record
# Type: A
# Alias: Yes → CloudFront distribution
```

Ou se usar outro provedor DNS (Cloudflare, GoDaddy, etc.):
- Crie um registro CNAME: `api.medalert.com.br` → `dxxxxxxx.cloudfront.net`

---

## Passo 11: Configurar o Mobile para Produção

No app mobile, configure a URL da API de produção:

```bash
# No eas.json (para builds EAS)
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.medalert.com.br/api/v1"
      }
    }
  }
}
```

Ou no `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.medalert.com.br/api/v1"
    }
  }
}
```


---

## Passo 12: CI/CD Simplificado (GitHub Actions)

Para automatizar deploys sem custo adicional:

```yaml
# .github/workflows/deploy.yml
name: Deploy MedAlert Backend

on:
  push:
    branches: [main]
    paths: [backend/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/medalert
            git pull origin main
            docker-compose up -d --build
            docker exec medalert-api alembic upgrade head
            echo "Deploy concluído!"
```

---

## Estimativa de Custos — Free Tier

### Primeiros 6 meses (Free Plan + $200 créditos)

| Serviço | Custo real | Coberto por |
|---------|-----------|-------------|
| Aurora Serverless v2 | ~$45/mês | Free Plan (4 ACUs + 1 GiB) |
| EC2 t3.micro | ~$8/mês | Créditos ($200) |
| Lambda (scheduler) | $0 | Always Free |
| EventBridge | $0 | Always Free |
| CloudFront | $0 | Always Free (1 TB) |
| SNS (push) | $0 | Always Free (1M) |
| CloudWatch | $0 | Always Free (5 GB logs) |
| Secrets Manager | ~$1.20/mês | Créditos |
| ACM (SSL) | $0 | Sempre gratuito |
| **Total mensal** | **$0** | **Coberto pelo Free Plan + créditos** |

### Após 6 meses (Always Free + serviços pagos)

| Serviço | Custo estimado/mês |
|---------|-------------------|
| Aurora Serverless v2 (0.5 ACU mínimo) | ~$45 |
| EC2 t3.micro | ~$8 |
| Lambda + EventBridge | $0 (Always Free) |
| CloudFront | $0 (Always Free) |
| SNS | $0 (Always Free) |
| CloudWatch | $0 (Always Free) |
| Secrets Manager | ~$1.20 |
| **Total** | **~$54/mês** |

### Alternativa ultra-econômica pós-Free Tier

Se quiser reduzir custos após os 6 meses:

| Mudança | Economia |
|---------|----------|
| Trocar Aurora por RDS PostgreSQL db.t4g.micro | -$30/mês (~$15 vs $45) |
| Usar EC2 Spot para workloads tolerantes | -$5/mês |
| Reservar EC2 (1 ano) | -$3/mês |
| **Total otimizado** | **~$20-25/mês** |


---

## Checklist de Deploy

- [ ] Conta AWS criada (pós-julho 2025 para Free Plan)
- [ ] AWS CLI configurado com credenciais
- [ ] Aurora Serverless v2 criado e acessível
- [ ] Migrações Alembic executadas no banco
- [ ] EC2 t3.micro rodando com Docker + FastAPI
- [ ] Nginx configurado como reverse proxy
- [ ] HTTPS ativo (Let's Encrypt ou ACM + CloudFront)
- [ ] Security groups configurados (EC2 → Aurora)
- [ ] Lambdas de scheduler criadas e testadas
- [ ] EventBridge rules ativas (4 schedules)
- [ ] SNS Platform Application configurada (FCM/APNs)
- [ ] Secrets Manager com credenciais (DB, JWT, FCM)
- [ ] CloudWatch alarmes configurados
- [ ] DNS apontando para CloudFront/EC2
- [ ] Mobile configurado com `EXPO_PUBLIC_API_URL` de produção
- [ ] Budget alert configurado (para evitar surpresas)

---

## Configurar Budget Alert (importante!)

Para evitar cobranças inesperadas:

```bash
aws budgets create-budget \
  --account-id <ACCOUNT_ID> \
  --budget '{
    "BudgetName": "medalert-monthly",
    "BudgetLimit": {"Amount": "10", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "seu@email.com"
    }]
  }]'
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| EC2 não conecta ao Aurora | Verificar security groups (EC2 SG deve estar como inbound no Aurora SG) |
| Lambda timeout | Verificar se Lambda está na mesma VPC que o Aurora |
| Push não chega | Verificar token FCM e Platform Application ARN |
| Certificado SSL pendente | Validar CNAME no DNS (ACM mostra o registro necessário) |
| Créditos acabando | Verificar no Billing Dashboard → Credits |
| Aurora não escala para zero | Mínimo é 0.5 ACU (não para completamente) |
| Alembic falha na migração | Verificar DATABASE_URL e conectividade de rede |

---

## Migração para Produção (pós-Free Tier)

Quando o app crescer e os créditos acabarem, migre para a arquitetura completa descrita em `docs/aws-architecture.md`:

1. **EC2 → ECS Fargate** (auto-scaling, zero gerenciamento de servidor)
2. **Nginx → ALB** (health checks nativos, TLS termination)
3. **Let's Encrypt → ACM** (renovação automática, integrado com ALB/CloudFront)
4. **Manual deploy → CodePipeline** (CI/CD completo com blue/green)
5. **Single AZ → Multi-AZ** (alta disponibilidade)

A migração é incremental — cada componente pode ser atualizado independentemente.

---

## Referências

- [AWS Free Tier (2025+)](https://aws.amazon.com/free/)
- [Aurora Serverless v2 — Free Plan](https://aws.amazon.com/rds/aurora/pricing/)
- [Lambda Always Free](https://aws.amazon.com/lambda/pricing/)
- [CloudFront Always Free](https://aws.amazon.com/cloudfront/pricing/)
- [SNS Pricing](https://aws.amazon.com/sns/pricing/)
- [EventBridge Pricing](https://aws.amazon.com/eventbridge/pricing/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [MedAlert — Arquitetura AWS](./aws-architecture.md)

---

*Guia criado em maio/2026. Verifique os limites atuais do Free Tier em [aws.amazon.com/free](https://aws.amazon.com/free/) antes de iniciar.*
