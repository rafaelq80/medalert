"""
Push notification message templates.
Each function returns a tuple of (title, body, data) for the notification.
Templates: LEMBRETE, FALHA_TOMADA, RETORNO_MEDICO.
"""


def lembrete_message(
    medicamento_nome: str, horario: str
) -> tuple[str, str]:
    """
    Return (title, body) for LEMBRETE notification.
    Sent to the paciente when it's time to take medication.
    """
    return (
        "Hora do medicamento!",
        f"Está na hora de tomar {medicamento_nome} ({horario})",
    )


def falha_tomada_message(
    paciente_nome: str, medicamento_nome: str, horario: str
) -> tuple[str, str]:
    """
    Return (title, body) for FALHA_TOMADA notification.
    Sent to responsáveis/cuidadores when a dose is not confirmed.
    """
    return (
        "Tomada não confirmada",
        f"{paciente_nome} não confirmou {medicamento_nome} das {horario}",
    )


def retorno_medico_message(
    medicamento_nome: str, data_retorno: str
) -> tuple[str, str]:
    """
    Return (title, body) for RETORNO_MEDICO notification.
    Sent to responsáveis when a medical return appointment is approaching.
    """
    return (
        "Retorno médico próximo",
        f"Retorno para {medicamento_nome} em {data_retorno}",
    )


def confirmacao_tomada_message(
    paciente_nome: str, medicamento_nome: str, horario: str
) -> tuple[str, str]:
    """
    Return (title, body) for confirmation notification.
    Sent to responsáveis/cuidadores when a dose is confirmed by the paciente.
    """
    return (
        "Tomada confirmada ✓",
        f"{paciente_nome} confirmou {medicamento_nome} das {horario}",
    )
