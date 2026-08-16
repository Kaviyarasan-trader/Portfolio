from django.shortcuts import render, redirect
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from .models import (
    Profile, Skill, Project, Experience, Education, Testimonial,
    HeroContent, AboutContent, WhatIBuildItem, EngineeringFocusItem,
    DevelopmentApproachStep, ContactInfo,
)
from .forms import ContactForm
from .github_service import get_github_stats

@never_cache
def index(request):
    profile = Profile.objects.first()
    skills = Skill.objects.all()
    projects = Project.objects.prefetch_related('images')
    experiences = Experience.objects.all()
    educations = Education.objects.all()
    testimonials = Testimonial.objects.all()

    hero = HeroContent.objects.first()
    about = AboutContent.objects.first()
    contact = ContactInfo.objects.first()
    what_i_build = WhatIBuildItem.objects.all()
    focus_items = EngineeringFocusItem.objects.all()
    approach_steps = DevelopmentApproachStep.objects.all()

    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            contact = form.save()
            try:
                send_mail(
                    f"Portfolio Contact: {contact.subject}",
                    f"From: {contact.name} <{contact.email}>\n\n{contact.message}",
                    settings.EMAIL_HOST_USER or 'noreply@portfolio.com',
                    [profile.email if profile else 'you@example.com'],
                    fail_silently=True,
                )
            except Exception:
                pass
            messages.success(request, "Message sent successfully! I'll get back to you soon.")
            return redirect('index')
    else:
        form = ContactForm()

    github_username = ''
    if profile and profile.github:
        github_username = profile.github.rstrip('/').split('/')[-1]

    profile_email = profile.email if profile else ''
    profile_github = profile.github if profile else ''
    profile_linkedin = profile.linkedin if profile else ''
    profile_location = profile.location if profile else ''

    about_email = about.email if (about and about.email) else profile_email
    about_location = about.location if (about and about.location) else profile_location
    about_github_url = ('https://github.com/' + about.github_username if about and about.github_username else profile_github)
    about_linkedin_url = ('https://www.linkedin.com/in/' + about.linkedin_username if about and about.linkedin_username else profile_linkedin)

    contact_email = contact.email if (contact and contact.email) else profile_email
    contact_github_url = ('https://github.com/' + contact.github_username if contact and contact.github_username else profile_github)
    contact_linkedin_url = ('https://www.linkedin.com/in/' + contact.linkedin_username if contact and contact.linkedin_username else profile_linkedin)

    skills_grouped = {}
    for s in skills:
        skills_grouped.setdefault(s.category, []).append(s)

    # Display categories in a fixed order: Frontend, Backend, Database, Tools
    category_order = ['frontend', 'backend', 'database', 'tools']
    ordered_grouped = {}
    for category in category_order:
        if category in skills_grouped:
            ordered_grouped[category] = skills_grouped[category]
    for category, skill_list in skills_grouped.items():
        if category not in category_order:
            ordered_grouped[category] = skill_list
    skills_grouped = ordered_grouped

    context = {
        'profile': profile,
        'hero': hero,
        'about': about,
        'contact': contact,
        'what_i_build': what_i_build,
        'focus_items': focus_items,
        'approach_steps': approach_steps,
        'about_email': about_email,
        'about_location': about_location,
        'about_github_url': about_github_url,
        'about_linkedin_url': about_linkedin_url,
        'contact_email': contact_email,
        'contact_github_url': contact_github_url,
        'contact_linkedin_url': contact_linkedin_url,
        'skills': skills,
        'skills_grouped': skills_grouped,
        'projects': projects,
        'gallery_projects': projects[:2],
        'experiences': experiences,
        'educations': educations,
        'testimonials': testimonials,
        'form': form,
        'github_username': github_username,
    }
    return render(request, 'index.html', context)


@never_cache
def github_stats(request):
    profile = Profile.objects.first()
    username = profile.github.rstrip('/').split('/')[-1] if profile and profile.github else ''
    return JsonResponse(get_github_stats(username))


@never_cache
def all_projects(request):
    projects = Project.objects.prefetch_related('images')
    context = {
        'projects': projects,
        'gallery_projects': projects,
    }
    return render(request, 'all_projects.html', context)