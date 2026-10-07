from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from .models import User


class MultiFieldAuthBackend(ModelBackend):
    """
    Authenticate against phone number, username, or email.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('phone') or kwargs.get('email')
        if not username or not password:
            return None

        # Clean up username/phone query
        query = Q(phone__iexact=username) | Q(username__iexact=username) | Q(email__iexact=username)
        
        # If it starts without '+', also check with '+'
        if not username.startswith('+') and username.isdigit():
            query |= Q(phone=f'+{username}')

        try:
            user = User.objects.get(query)
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            return None
        return None
