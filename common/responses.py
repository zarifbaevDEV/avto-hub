from rest_framework.response import Response
from rest_framework import status


def api_response(data=None, message=None, errors=None, success=True, status_code=status.HTTP_200_OK):
    """
    Standard unified API Response structure conforming to AvtoHub Technical Specification:
    {
      "success": true/false,
      "data": ... or {},
      "message": ... or null,
      "errors": ... or null
    }
    """
    payload = {
        "success": success,
        "data": data if data is not None else {},
        "message": message,
        "errors": errors
    }
    return Response(payload, status=status_code)


def success_response(data=None, message="Muvaffaqiyatli bajarildi", status_code=status.HTTP_200_OK):
    return api_response(data=data, message=message, errors=None, success=True, status_code=status_code)


def error_response(errors=None, message="Xatolik yuz berdi", status_code=status.HTTP_400_BAD_REQUEST):
    return api_response(data=None, message=message, errors=errors, success=False, status_code=status_code)
