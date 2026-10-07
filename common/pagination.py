import math
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        total_items = self.page.paginator.count
        page_size = self.get_page_size(self.request) or self.page_size
        total_pages = math.ceil(total_items / page_size) if page_size else 1

        return Response({
            'success': True,
            'data': data,
            'pagination': {
                'page': self.page.number,
                'page_size': page_size,
                'total': total_items,
                'total_pages': total_pages
            }
        })
