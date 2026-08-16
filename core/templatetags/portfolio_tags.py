from django import template
from core.models import HeroContent

register = template.Library()


@register.simple_tag(takes_context=True)
def resume_url(context):
    hero = context.get('hero') or HeroContent.objects.first()
    if hero and hero.resume_pdf:
        return hero.resume_pdf.url
    profile = context.get('global_profile') or context.get('profile')
    if profile and getattr(profile, 'has_resume', False) and profile.resume:
        return profile.resume.url
    return '/resume.pdf'
