from django.db import models

# Create your models here.
class Link(models.Model):
    titulo = models.CharField(max_length=200)
    tecnologia = models.CharField(max_length=100)
    seniority = models.CharField(max_length=50)
    autor = models.CharField(max_length=100)
    observacion = models.TextField(blank=True, null=True)
    link = models.URLField()
    status = models.BooleanField(default=True)

    def __str__(self):
        return self.titulo