from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser))


class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role in ['ADMIN', 'SUPER_ADMIN'] or request.user.is_staff or request.user.is_superuser)
        )


class IsModerator(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role in ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'] or request.user.is_staff)
        )


class IsDealer(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['DEALER', 'ADMIN', 'SUPER_ADMIN']
        )


class IsServiceOwner(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['SERVICE_OWNER', 'ADMIN', 'SUPER_ADMIN']
        )


class IsPartsSeller(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            request.user.role in ['PARTS_SELLER', 'ADMIN', 'SUPER_ADMIN']
        )


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    Assumes model instance has an `owner` or `seller` or `user` attribute.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        if hasattr(obj, 'seller') and hasattr(obj.seller, 'user'):
            return obj.seller.user == request.user or request.user.is_staff
        elif hasattr(obj, 'seller'):
            return obj.seller == request.user or request.user.is_staff
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user or request.user.is_staff
        elif hasattr(obj, 'user'):
            return obj.user == request.user or request.user.is_staff

        return False
