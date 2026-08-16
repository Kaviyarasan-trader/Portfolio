from django.contrib import admin
from .models import (
    Profile, Skill, Technology, Project, ProjectImage, 
    Experience, Education, Testimonial, ContactMessage, HeroContent, 
    AboutContent, WhatIBuildItem, EngineeringFocusItem, 
    DevelopmentApproachStep, ContactInfo
)
from .forms import ProjectAdminForm

admin.site.site_header = 'Portfolio Studio'
admin.site.site_title = 'Portfolio Studio · Admin'
admin.site.index_title = 'Dashboard'

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'email')

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'proficiency', 'order')
    list_editable = ('proficiency', 'order')
    list_filter = ('category',)

@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon_name', 'brand_color')
    search_fields = ('name',)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectAdminForm
    list_display = ('title', 'featured', 'order', 'created_at')
    list_editable = ('featured', 'order')
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ('tech_stack',)
    fieldsets = (
        (None, {'fields': ('title', 'slug', 'short_description', 'description', 'tech_stack', 'featured', 'order')}),
        ('Case Study Narrative', {'fields': ('problem', 'approach', 'outcome')}),
        ('Links', {'fields': ('github_link', 'live_link')}),
    )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        project = form.instance
        for image in list(form.cleaned_data.get('delete_images', [])):
            image.delete()
        uploads = form.cleaned_data.get('images') or []
        base = project.images.count()
        for i, f in enumerate(uploads):
            ProjectImage.objects.create(project=project, image=f, order=base + i)

    class Media:
        js = ('js/admin-project-images.js',)
        css = {'all': ('css/admin-project-images.css',)}

@admin.register(ProjectImage)
class ProjectImageAdmin(admin.ModelAdmin):
    list_display = ('project', 'order', 'image')
    list_filter = ('project',)
    list_editable = ('order',)

@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ('role', 'company', 'start_date', 'end_date', 'is_current')

@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('degree', 'institution', 'university', 'start_year', 'end_year')

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'designation')

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at', 'is_read')
    list_editable = ('is_read',)
    readonly_fields = ('created_at',)

@admin.register(HeroContent)
class HeroContentAdmin(admin.ModelAdmin):
    list_display = ('name', 'role_title', 'status_badge_text')
    fieldsets = (
        (None, {'fields': ('name', 'role_title', 'tagline', 'description', 'status_badge_text')}),
        ('Files', {'fields': ('resume_pdf', 'profile_image')}),
    )

@admin.register(AboutContent)
class AboutContentAdmin(admin.ModelAdmin):
    list_display = ('heading', 'location', 'email')

@admin.register(WhatIBuildItem)
class WhatIBuildItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'icon_name', 'order')
    list_editable = ('order',)
    list_display_links = ('title',)

@admin.register(EngineeringFocusItem)
class EngineeringFocusItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'icon_name', 'order')
    list_editable = ('order',)
    list_display_links = ('title',)

@admin.register(DevelopmentApproachStep)
class DevelopmentApproachStepAdmin(admin.ModelAdmin):
    list_display = ('step_number', 'title', 'icon_name', 'order')
    list_editable = ('order', 'step_number')
    list_display_links = ('title',)

@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ('heading', 'email', 'github_username', 'linkedin_username')