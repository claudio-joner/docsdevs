from django.contrib import admin
from .models import Link

@admin.register(Link)
class LinkAdmin(admin.ModelAdmin):
    list_display = ("titulo", "tecnologia", "seniority", "autor", "link", "observacion_corta", "status")
    list_filter = ("tecnologia", "seniority", "status")
    search_fields = ("titulo", "autor", "tecnologia", "seniority", "observacion", "link")

    def observacion_corta(self, obj):
        return (obj.observacion or "")[:40]
    observacion_corta.short_description = "Observación"
