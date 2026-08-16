from django.urls import path
from . import views
from .api import ProjectListAPIView

urlpatterns = [
    path('', views.index, name='index'),
    path('github-stats/', views.github_stats, name='github_stats'),
    path('projects/', views.all_projects, name='all_projects'),
    path('api/projects/', ProjectListAPIView.as_view(), name='api-projects'),
]