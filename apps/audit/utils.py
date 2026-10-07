from .models import AuditLog


def log_action(user=None, action="", model="", object_id="", old_data=None, new_data=None, request=None):
    """
    Helper function to reliably create audit logs.
    """
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        if not user and request.user.is_authenticated:
            user = request.user

    return AuditLog.objects.create(
        user=user,
        action=action,
        model=model,
        object_id=str(object_id),
        old_data=old_data,
        new_data=new_data,
        ip_address=ip_address
    )
