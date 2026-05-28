"""
APScheduler configuration and job registration.
Uses AsyncIOScheduler for async job execution within the FastAPI event loop.
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(
    job_defaults={
        "coalesce": True,  # Combine missed executions into one
        "max_instances": 1,  # Only one instance of each job at a time
        "misfire_grace_time": 60,  # Allow 60s grace for misfired jobs
    }
)


def configure_jobs():
    """Register all scheduled jobs with the scheduler."""
    from app.scheduler.jobs import (
        job_alertas_retorno_medico,
        job_gerar_registros_tomada,
        job_marcar_ignorados,
        job_verificar_atrasos,
    )

    # Job 1: Generate REGISTRO_TOMADA for upcoming doses (every 5 minutes)
    scheduler.add_job(
        job_gerar_registros_tomada,
        trigger=IntervalTrigger(minutes=5),
        id="gerar_registros_tomada",
        name="Gerar registros de tomada pendentes",
        replace_existing=True,
    )

    # Job 2: Check for overdue doses and mark as ATRASADO (every 2 minutes)
    scheduler.add_job(
        job_verificar_atrasos,
        trigger=IntervalTrigger(minutes=2),
        id="verificar_atrasos",
        name="Verificar atrasos de tomada",
        replace_existing=True,
    )

    # Job 3: Mark old ATRASADO records as IGNORADO (every 5 minutes)
    scheduler.add_job(
        job_marcar_ignorados,
        trigger=IntervalTrigger(minutes=5),
        id="marcar_ignorados",
        name="Marcar registros ignorados",
        replace_existing=True,
    )

    # Job 4: Alert about upcoming medical returns (daily at 06:00 UTC)
    scheduler.add_job(
        job_alertas_retorno_medico,
        trigger=CronTrigger(hour=6, minute=0),
        id="alertas_retorno_medico",
        name="Alertas de retorno médico",
        replace_existing=True,
    )

    logger.info("Scheduler jobs configured successfully")


configure_jobs()
