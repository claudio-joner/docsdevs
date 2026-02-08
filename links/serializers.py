from rest_framework import serializers
from .models import Link

class LinkSerializer(serializers.ModelSerializer):
    # Para que el front mande 0/1
    status = serializers.IntegerField()

    class Meta:
        model = Link
        fields = ["id", "titulo", "tecnologia", "seniority", "autor", "link", "observacion", "status"]

    def validate_status(self, value):
        # Acepta 0 o 1 solamente
        if value not in (0, 1):
            raise serializers.ValidationError("status debe ser 0 o 1")
        return value

    def create(self, validated_data):
        validated_data["status"] = bool(validated_data["status"])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "status" in validated_data:
            validated_data["status"] = bool(validated_data["status"])
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["status"] = 1 if instance.status else 0
        return data
