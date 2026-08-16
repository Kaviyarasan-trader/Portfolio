import os

from .models import Profile, HeroContent


def profile_context(request):
    profile = Profile.objects.first()
    hero = HeroContent.objects.first()

    image_url = None
    image_version = None
    for source in (hero.profile_image if hero else None, profile.profile_image if profile else None):
        if source and source.storage.exists(source.name):
            image_url = source.url
            try:
                image_version = int(os.path.getmtime(source.path) * 1000)
            except Exception:
                image_version = None
            break

    return {
        'global_profile': profile,
        'global_profile_image': image_url,
        'global_profile_image_exists': bool(image_url),
        'global_profile_image_version': image_version,
    }
