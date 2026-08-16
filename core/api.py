from rest_framework import serializers, generics
from .models import Project, ProjectImage


class ProjectImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'order']


class ProjectSerializer(serializers.ModelSerializer):
    images = ProjectImageSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'title', 'short_description', 'tech_stack', 'github_link', 'live_link', 'featured', 'images']


class ProjectListAPIView(generics.ListAPIView):
    queryset = Project.objects.prefetch_related('images')
    serializer_class = ProjectSerializer
