# MedAlert — Arquitetura AWS (Well-Architected)

## Visão Geral

Este documento define a arquitetura de nuvem para hospedar o backend do MedAlert na AWS. O app mobile (React Native) não reside na AWS — apenas consome a API via HTTPS.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (us-east-1)                        │
│                                                                     │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────────────────┐   │
│  │ Route 53 │───▶│ CloudFront  │───▶│  Application Load        │   │
│  │  (DNS)   │    │  (CDN/WAF)  │    │  Balancer (ALB)          │   │
│  └──────────┘    └─────────────┘    └──────────┬───────────────┘   │
│                                                  │                   │
│                                     ┌────────────▼────────────┐     │
│                                     │   ECS Fargate Service   │     │
│                                     │   (FastAPI containers)  │     │
│                                     │   - Min: 1 / Max: 4     │     │
│                                     └────────────┬────────────┘     │
│                                                  │                   │
│                          ┌───────────────────────┼──────────────┐   │
│                          │                       │              │   │
│               ┌──────────▼──────┐   ┌───────────▼───────────┐  │   │
│               │  Aurora Serverless│   │  Secrets Manager     │  │   │
│               │  v2 (PostgreSQL) │   │  (JWT, FCM keys)     │  │   │
│               │  Min: 0.5 ACU    │   └──────────────────────┘  │   │
│               │  Max: 4 ACU      │                              │   │
│               └─────────────────┘                               │   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Observabilidade                                              │   │
│  │  CloudWatch Logs + Metrics + X-Ray + Alarms                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Serviços AWS Selecionados

| Serviço | Função | Justificativa |
|---------|--------|---------------|
| **ECS Fargate** | Compute (containers) | Serverless containers — sem gerenciamento de EC2, auto-scaling por CPU/memória, ideal para APIs containerizadas |
| **Aurora Serverless v2** | Banco de dados PostgreSQL | Escala automaticamente de 0.5 a 4 ACUs, compatível com PostgreSQL 15, custo proporcional ao uso |
| **Application Load Balancer** | Roteamento HTTP/HTTPS | Health checks, TLS termination, integração nativa com ECS |
| **CloudFront** | CDN + WAF | Cache de respostas estáticas, proteção DDoS, WAF para rate limiting |
| **Route 53** | DNS | Roteamento de domínio com health checks |
| **Secrets Manager** | Gestão de segredos | Rotação automática de credenciais, integração com ECS task definitions |
| **ECR** | Container Registry | Armazenamento de imagens Docker, scan de vulnerabilidades |
| **CloudWatch** | Observabilidade | Logs estruturados, métricas customizadas, alarmes, dashboards |
| **X-Ray** | Tracing distribuído | Rastreamento de requisições end-to-end |
| **SNS** | Push notifications | Integração com FCM/APNs para envio de push ao mobile |
| **EventBridge Scheduler** | Jobs agendados | Substitui APScheduler — managed, serverless, sem estado |
| **Lambda** | Funções de scheduler | Executa os 4 jobs (gerar registros, verificar atrasos, marcar ignorados, alertas retorno) |

## Decisões Arquiteturais

### Compute: ECS Fargate (não Lambda para a API)

A API FastAPI usa WebSockets implícitos (APScheduler), conexões de banco persistentes e tem cold start inaceitável para UX de idosos. ECS Fargate mantém containers quentes com auto-scaling.

### Banco: Aurora Serverless v2 (não RDS padrão)

- Escala para zero em períodos de inatividade (0.5 ACU mínimo)
- Compatível com PostgreSQL 15 (mesma engine do desenvolvimento local)
- Failover automático multi-AZ
- Custo otimizado para workloads variáveis (app de saúde com picos em horários de medicação)

### Scheduler: EventBridge + Lambda (não APScheduler embutido)

O APScheduler embutido no Fargate não é resiliente — se o container reiniciar, jobs são perdidos. EventBridge Scheduler é managed, durável e invoca Lambdas independentes:

| Job | Schedule Expression | Lambda |
|-----|-------------------|--------|
| gerar_registros_tomada | `rate(5 minutes)` | `medalert-gerar-registros` |
| verificar_atrasos | `rate(2 minutes)` | `medalert-verificar-atrasos` |
| marcar_ignorados | `rate(5 minutes)` | `medalert-marcar-ignorados` |
| alertas_retorno_medico | `cron(0 6 * * ? *)` | `medalert-alertas-retorno` |

### Push Notifications: SNS Platform Application

SNS gerencia tokens FCM/APNs nativamente, com retry automático e métricas de entrega.

## Well-Architected Framework

### Pilar 1: Segurança

| Prática | Implementação |
|---------|---------------|
| Princípio do menor privilégio | IAM roles específicas por serviço (ECS task role, Lambda execution role) |
| Segredos nunca em código | Secrets Manager para JWT_SECRET, DATABASE_URL, FCM_SERVER_KEY |
| Criptografia em trânsito | TLS 1.2+ via ALB + CloudFront (certificado ACM) |
| Criptografia em repouso | Aurora encryption at rest (KMS), ECR image scanning |
| Rede isolada | VPC com subnets privadas para Fargate e Aurora, apenas ALB em subnet pública |
| WAF | Rate limiting (100 req/s por IP), bloqueio de padrões maliciosos |
| Autenticação | JWT validado no container, tokens em Secrets Manager |

### Pilar 2: Confiabilidade

| Prática | Implementação |
|---------|---------------|
| Multi-AZ | Aurora Serverless v2 multi-AZ, Fargate tasks em 2+ AZs |
| Health checks | ALB health check em `/health`, ECS container health check |
| Auto-scaling | Fargate: target tracking 70% CPU, min 1 / max 4 tasks |
| Backup | Aurora automated backups (7 dias retenção), point-in-time recovery |
| Circuit breaker | ECS deployment circuit breaker com rollback automático |
| Retry | EventBridge retry policy (3 tentativas com backoff) |

### Pilar 3: Eficiência de Performance

| Prática | Implementação |
|---------|---------------|
| Right-sizing | Fargate: 0.5 vCPU / 1 GB RAM (suficiente para FastAPI async) |
| Conexões de banco | Connection pooling via SQLAlchemy async (pool_size=5) |
| Cache | CloudFront cache para GET /categorias (dados estáticos) |
| Async I/O | FastAPI + asyncpg — non-blocking database queries |
| CDN | CloudFront reduz latência para o app mobile |

### Pilar 4: Otimização de Custos

| Prática | Implementação |
|---------|---------------|
| Pay-per-use | Aurora Serverless v2 (paga por ACU/hora), Fargate (paga por vCPU/hora) |
| Scale to near-zero | Aurora min 0.5 ACU, Fargate min 1 task (pode ser 0 com scale-to-zero) |
| Spot não aplicável | Fargate Spot não recomendado para API de saúde (interrupções) |
| Reservas futuras | Fargate Savings Plans quando tráfego estabilizar (até 50% desconto) |
| Lifecycle policies | ECR: manter apenas 5 imagens mais recentes |
| Log retention | CloudWatch: 30 dias para logs, 90 dias para métricas |

### Pilar 5: Excelência Operacional

| Prática | Implementação |
|---------|---------------|
| IaC | CDK em Python — toda infraestrutura versionada |
| CI/CD | CodePipeline: build → test → deploy (blue/green via ECS) |
| Observabilidade | CloudWatch Logs (structured JSON), X-Ray tracing, custom metrics |
| Alarmes | CPU > 80%, erros 5xx > 5/min, latência p99 > 2s, Aurora connections > 80% |
| Runbooks | Documentação de rollback, scaling manual, troubleshooting |
| Tagging | Tags: `project=medalert`, `environment=prod/dev`, `team=backend` |

## Estimativa de Custos (us-east-1, workload baixo)

| Serviço | Configuração | Custo estimado/mês |
|---------|-------------|-------------------|
| ECS Fargate | 1 task (0.5 vCPU, 1 GB) 24/7 | ~$18 |
| Aurora Serverless v2 | 0.5-2 ACU, 20 GB storage | ~$45 |
| ALB | 1 ALB + LCUs baixos | ~$20 |
| CloudFront | 10 GB transfer, 100K requests | ~$2 |
| Secrets Manager | 5 secrets | ~$2 |
| CloudWatch | Logs + metrics + alarms | ~$10 |
| Lambda (scheduler) | 4 funções, ~26K invocações/mês | ~$1 |
| ECR | 2 GB images | ~$0.20 |
| SNS (push) | 10K notifications/mês | ~$1 |
| **Total estimado** | | **~$99/mês** |

> Nota: Estimativa para ambiente de produção com tráfego baixo (~100 usuários ativos). Free tier pode reduzir custos nos primeiros 12 meses.

## Estrutura do Projeto CDK

```
infra/
├── src/
│   ├── app.py                    # Entry point CDK
│   ├── stack.py                  # MedAlertStack (single stack)
│   └── constructs/
│       ├── networking.py         # VPC, subnets, security groups
│       ├── database.py           # Aurora Serverless v2
│       ├── compute.py            # ECS Fargate + ALB
│       ├── scheduler.py          # EventBridge + Lambda functions
│       ├── observability.py      # CloudWatch, X-Ray, alarms
│       └── cdn.py                # CloudFront + WAF
├── functions/
│   ├── gerar_registros/          # Lambda handler
│   ├── verificar_atrasos/        # Lambda handler
│   ├── marcar_ignorados/         # Lambda handler
│   └── alertas_retorno/          # Lambda handler
├── tests/
│   ├── test_stack.py             # CDK assertions
│   └── test_constructs.py        # Construct unit tests
├── cdk.json
└── requirements.txt
```

## Código CDK — Stack Principal

```python
# infra/src/stack.py
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_ecr_assets as ecr_assets,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_lambda as lambda_,
    aws_events as events,
    aws_events_targets as targets,
    aws_elasticloadbalancingv2 as elbv2,
)
from constructs import Construct


class MedAlertStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ─── Networking ───────────────────────────────────────────
        vpc = ec2.Vpc(
            self, "MedAlertVpc",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # ─── Secrets ─────────────────────────────────────────────
        db_secret = secretsmanager.Secret(
            self, "MedAlertDbSecret",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "medalert_admin"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32,
            ),
        )

        jwt_secret = secretsmanager.Secret(
            self, "MedAlertJwtSecret",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                exclude_punctuation=True,
                password_length=64,
            ),
        )

        # ─── Database (Aurora Serverless v2) ─────────────────────
        db_cluster = rds.DatabaseCluster(
            self, "MedAlertDatabase",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_4,
            ),
            credentials=rds.Credentials.from_secret(db_secret),
            default_database_name="medalert",
            serverless_v2_min_capacity=0.5,
            serverless_v2_max_capacity=4,
            writer=rds.ClusterInstance.serverless_v2("Writer"),
            readers=[
                rds.ClusterInstance.serverless_v2("Reader",
                    scale_with_writer=True,
                ),
            ],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
            ),
            storage_encrypted=True,
            backup=rds.BackupProps(retention=Duration.days(7)),
            removal_policy=RemovalPolicy.SNAPSHOT,
        )

        # ─── ECS Cluster ─────────────────────────────────────────
        cluster = ecs.Cluster(
            self, "MedAlertCluster",
            vpc=vpc,
            container_insights_v2=ecs.ContainerInsights.ENABLED,
        )

        # ─── Fargate Service + ALB ───────────────────────────────
        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self, "MedAlertApiService",
            cluster=cluster,
            cpu=512,
            memory_limit_mib=1024,
            desired_count=1,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_asset("../backend"),
                container_port=8000,
                environment={
                    "ALGORITHM": "HS256",
                    "ACCESS_TOKEN_EXPIRE_MINUTES": "1440",
                    "REFRESH_TOKEN_EXPIRE_DAYS": "30",
                },
                secrets={
                    "DATABASE_URL": ecs.Secret.from_secrets_manager(db_secret),
                    "SECRET_KEY": ecs.Secret.from_secrets_manager(jwt_secret),
                },
                log_driver=ecs.LogDrivers.aws_logs(
                    stream_prefix="medalert-api",
                    log_retention=logs.RetentionDays.ONE_MONTH,
                ),
            ),
            public_load_balancer=True,
            assign_public_ip=False,
            task_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
            ),
            circuit_breaker=ecs.DeploymentCircuitBreaker(
                rollback=True,
            ),
            enable_execute_command=True,
        )

        # Health check
        fargate_service.target_group.configure_health_check(
            path="/health",
            healthy_http_codes="200",
            interval=Duration.seconds(30),
            timeout=Duration.seconds(5),
        )

        # Auto-scaling
        scaling = fargate_service.service.auto_scale_task_count(
            min_capacity=1,
            max_capacity=4,
        )
        scaling.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(30),
        )

        # Allow Fargate to connect to Aurora
        db_cluster.connections.allow_default_port_from(
            fargate_service.service,
            "Allow Fargate to Aurora",
        )

        # ─── Scheduler Lambdas ───────────────────────────────────
        scheduler_layer = lambda_.LayerVersion(
            self, "MedAlertSchedulerLayer",
            code=lambda_.Code.from_asset("functions/layer"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_12],
            description="Shared dependencies for scheduler lambdas",
        )

        jobs = [
            ("GerarRegistros", "gerar_registros", "rate(5 minutes)"),
            ("VerificarAtrasos", "verificar_atrasos", "rate(2 minutes)"),
            ("MarcarIgnorados", "marcar_ignorados", "rate(5 minutes)"),
            ("AlertasRetorno", "alertas_retorno", "cron(0 6 * * ? *)"),
        ]

        for logical_id, folder, schedule_expr in jobs:
            fn = lambda_.Function(
                self, f"MedAlert{logical_id}Function",
                runtime=lambda_.Runtime.PYTHON_3_12,
                handler="handler.lambda_handler",
                code=lambda_.Code.from_asset(f"functions/{folder}"),
                layers=[scheduler_layer],
                timeout=Duration.seconds(60),
                memory_size=256,
                environment={
                    "DATABASE_URL": db_secret.secret_value.unsafe_unwrap(),
                    "POWERTOOLS_SERVICE_NAME": f"medalert-{folder}",
                    "LOG_LEVEL": "INFO",
                },
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                ),
                tracing=lambda_.Tracing.ACTIVE,
                log_retention=logs.RetentionDays.ONE_MONTH,
            )

            db_cluster.connections.allow_default_port_from(fn)
            db_secret.grant_read(fn)

            events.Rule(
                self, f"MedAlert{logical_id}Schedule",
                schedule=events.Schedule.expression(schedule_expr),
                targets=[targets.LambdaFunction(fn)],
            )

        # ─── Observability ────────────────────────────────────────
        alarm_topic = sns.Topic(self, "MedAlertAlarmTopic")

        # CPU alarm
        cloudwatch.Alarm(
            self, "MedAlertHighCpuAlarm",
            metric=fargate_service.service.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="API CPU > 80% por 3 períodos consecutivos",
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # 5xx errors alarm
        cloudwatch.Alarm(
            self, "MedAlertHigh5xxAlarm",
            metric=fargate_service.load_balancer.metric_http_code_target(
                code=elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
                period=Duration.minutes(1),
            ),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Mais de 5 erros 5xx por minuto",
        ).add_alarm_action(cw_actions.SnsAction(alarm_topic))
```

## Código CDK — Entry Point

```python
# infra/src/app.py
import aws_cdk as cdk
from stack import MedAlertStack

app = cdk.App()

MedAlertStack(
    app, "medalert-prod",
    env=cdk.Environment(
        account="ACCOUNT_ID",
        region="us-east-1",
    ),
    description="MedAlert Backend - Production Environment",
)

app.synth()
```

## Monitoramento e Logging

### AWS Powertools (Lambda Scheduler)

Cada Lambda de scheduler usa AWS Powertools para:

```python
# functions/gerar_registros/handler.py
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="MedAlert")


@logger.inject_lambda_context(log_event=True)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event, context):
    logger.info("Iniciando geração de registros de tomada")

    try:
        registros_criados = gerar_registros_tomada()
        metrics.add_metric(
            name="RegistrosCriados",
            unit=MetricUnit.Count,
            value=registros_criados,
        )
        logger.info(f"Registros criados: {registros_criados}")
        return {"statusCode": 200, "body": f"{registros_criados} registros criados"}

    except Exception as e:
        logger.exception("Erro ao gerar registros de tomada")
        metrics.add_metric(name="Errors", unit=MetricUnit.Count, value=1)
        raise
```

### Structured Logging (Fargate)

O container FastAPI usa logging JSON estruturado:

```python
# backend/app/core/logging.py
import logging
import json
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "medalert-api",
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)
```

### Alarmes Configurados

| Alarme | Condição | Ação |
|--------|----------|------|
| HighCPU | CPU > 80% por 9 min | SNS → email ops |
| High5xx | > 5 erros 5xx/min por 2 min | SNS → email ops |
| HighLatency | p99 > 2s por 5 min | SNS → email ops |
| DBConnections | Connections > 80% max | SNS → email ops |
| SchedulerErrors | Lambda errors > 0 por 5 min | SNS → email ops |

## Segurança de Rede

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│  Public Subnets (2 AZs)            │
│  - ALB                              │
│  - NAT Gateway                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Private Subnets (2 AZs)           │
│  - ECS Fargate tasks                │
│  - Lambda functions (scheduler)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Isolated Subnets (2 AZs)          │
│  - Aurora Serverless v2             │
│  - Sem acesso à internet            │
└─────────────────────────────────────┘
```

Security Groups:
- **ALB SG**: Inbound 443 (HTTPS) de 0.0.0.0/0
- **Fargate SG**: Inbound 8000 apenas do ALB SG
- **Aurora SG**: Inbound 5432 apenas do Fargate SG e Lambda SG
- **Lambda SG**: Outbound para Aurora SG na porta 5432

## Deploy

```bash
# Instalar dependências CDK
cd infra
pip install -r requirements.txt

# Bootstrap (primeira vez)
cdk bootstrap aws://ACCOUNT_ID/us-east-1

# Deploy
cdk deploy medalert-prod

# Executar migrações após deploy
aws ecs execute-command \
  --cluster medalert-prod \
  --task TASK_ID \
  --container medalert-api \
  --interactive \
  --command "alembic upgrade head"
```

## Próximos Passos

1. Configurar CI/CD com CodePipeline (build → test → deploy blue/green)
2. Adicionar CloudFront + WAF na frente do ALB
3. Configurar Route 53 com domínio customizado + certificado ACM
4. Implementar SNS Platform Application para push notifications
5. Configurar alarmes de billing (budget alerts)
