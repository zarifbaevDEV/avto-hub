from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standardizes error responses to match AvtoHub specification:
    {
      "success": false,
      "data": {},
      "message": "Error description",
      "errors": {...}
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        message = "So'rovni bajarishda xatolik yuz berdi"

        if isinstance(errors, dict):
            if 'detail' in errors:
                message = str(errors['detail'])
                errors = None
            elif len(errors) == 1 and '__all__' in errors:
                message = str(errors['__all__'][0])
                errors = None
        elif isinstance(errors, list) and len(errors) > 0:
            message = str(errors[0])
            errors = None

        response.data = {
            'success': False,
            'data': {},
            'message': message,
            'errors': errors
        }
        return response

    logger.exception(f"Unhandled exception caught: {exc}")
    return Response(
        {
            'success': False,
            'data': {},
            'message': "Serverda kutilmagan xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.",
            'errors': str(exc)
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
