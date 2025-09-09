from flask import current_app
from flask_mail import Message, Mail
from datetime import datetime

def send_admin_leave_notification(leave_request, employee_info):
    """Envoyer une notification par email à l'administrateur concernant une nouvelle demande de congé"""
    mail = current_app.extensions.get('mail')
    if not mail:
        current_app.logger.error("Extension mail non initialisée")
        return False

    admin_email = current_app.config.get('ADMIN_EMAIL')  # Récupérer l'email admin depuis la config
    if not admin_email:
        current_app.logger.error("Email administrateur non configuré")
        return False

    # Formater les dates
    start_date = (
        leave_request['start_date'].strftime('%d/%m/%Y')
        if isinstance(leave_request['start_date'], datetime)
        else leave_request['start_date']
    )
    end_date = (
        leave_request['end_date'].strftime('%d/%m/%Y')
        if isinstance(leave_request['end_date'], datetime)
        else leave_request['end_date']
    )

    # Créer le sujet et le corps de l'email
    subject = f"Nouvelle Demande de Congé de {employee_info.get('name', 'Un Employé')}"

    body = f"""
    Cher Administrateur,

    Une nouvelle demande de congé a été soumise et nécessite votre attention.

    👤 Détails de l'Employé:
    - Nom: {employee_info.get('name', 'Non disponible')}
    - Email: {employee_info.get('email', 'Non disponible')}
    # - Département: {employee_info.get('department', 'Non disponible')}

    📅 Détails de la Demande de Congé:
    - Type de Congé: {leave_request['leave_type'].capitalize()}
    - Date de Début: {start_date}
    - Date de Fin: {end_date}
    - Nombre Total de Jours: {leave_request.get('leave_days', 'Non disponible')}
    - Motif: {leave_request.get('reason', 'Aucun motif fourni')}

    Veuillez examiner cette demande dès que possible.

    Cordialement,
    Dynamix services
    """

    try:
        msg = Message(
            subject=subject,
            recipients=[admin_email],
            body=body,
            sender=current_app.config.get('MAIL_DEFAULT_SENDER')
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Échec de l'envoi de la notification admin: {str(e)}")
        return False