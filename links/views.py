from rest_framework.viewsets import ModelViewSet
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Link
from .serializers import LinkSerializer

from django.shortcuts import render


class LinkViewSet(ModelViewSet):
    queryset = Link.objects.all().order_by("-id")
    serializer_class = LinkSerializer

    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["titulo", "autor", "tecnologia", "seniority", "observacion", "link"]

    ordering_fields = ["id", "titulo", "tecnologia", "seniority", "status"]
    ordering = ["-id"]

    
def home(request):
    return render(request, "front/index.html")