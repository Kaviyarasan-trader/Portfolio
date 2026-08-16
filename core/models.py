from django.db import models

class Profile(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=150, help_text="e.g. Django Full Stack Developer")
    tagline = models.CharField(max_length=250, blank=True)
    about = models.TextField()
    profile_image = models.ImageField(upload_to='profile/')
    resume = models.FileField(upload_to='resume/', blank=True, null=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    leetcode = models.URLField(blank=True)

    def __str__(self):
        return self.name

    @property
    def has_profile_image(self):
        return bool(self.profile_image and self.profile_image.storage.exists(self.profile_image.name))

    @property
    def has_resume(self):
        return bool(self.resume and self.resume.storage.exists(self.resume.name))


class Skill(models.Model):
    CATEGORY_CHOICES = [
        ('backend', 'Backend'),
        ('frontend', 'Frontend'),
        ('database', 'Database'),
        ('tools', 'Tools & Others'),
    ]
    name = models.CharField(max_length=50)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    proficiency = models.PositiveIntegerField(help_text="0-100")
    icon_class = models.CharField(max_length=100, help_text="e.g. devicon-django-plain")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


class Technology(models.Model):
    name = models.CharField(max_length=50, unique=True)
    icon_name = models.CharField(max_length=100, help_text="e.g. fa-django, fa-python")
    brand_color = models.CharField(max_length=7, blank=True, help_text="Hex color e.g. #092E20")

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Project(models.Model):
    title = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    short_description = models.CharField(max_length=250)
    description = models.TextField()
    problem = models.TextField(blank=True, help_text="The problem or need this project addresses")
    approach = models.TextField(blank=True, help_text="Key technical decisions and why they were chosen")
    outcome = models.TextField(blank=True, help_text="Concrete scope, scale, and results")
    tech_stack = models.ManyToManyField(Technology, blank=True, related_name='projects')
    github_link = models.URLField(blank=True)
    live_link = models.URLField(blank=True)
    featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-featured', '-created_at']

    def __str__(self):
        return self.title


class ProjectImage(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='projects/')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.project.title} — image {self.order}"


class Experience(models.Model):
    company = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    is_current = models.BooleanField(default=False)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.role} at {self.company}"


class Education(models.Model):
    institution = models.CharField(max_length=200)
    university = models.CharField(max_length=150, blank=True)
    degree = models.CharField(max_length=150)
    start_year = models.CharField(max_length=10)
    end_year = models.CharField(max_length=10)
    grade = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ['-start_year']

    def __str__(self):
        return f"{self.degree} - {self.institution}"


class Testimonial(models.Model):
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=150)
    message = models.TextField()
    image = models.ImageField(upload_to='testimonials/', blank=True, null=True)

    def __str__(self):
        return self.name


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject}"


class HeroContent(models.Model):
    """Singleton model for hero section content"""
    name = models.CharField(max_length=100)
    role_title = models.CharField(max_length=150)
    tagline = models.CharField(max_length=250, blank=True)
    description = models.TextField(help_text="The main hero paragraph")
    status_badge_text = models.CharField(max_length=100, default="Open to opportunities")
    resume_pdf = models.FileField(upload_to='resume/', blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile/', blank=True, null=True)

    class Meta:
        verbose_name = "Hero Content"

    def __str__(self):
        return "Hero Section"


class AboutContent(models.Model):
    """Singleton model for about section content"""
    heading = models.CharField(max_length=200, default="Practical products backed by real logic.")
    bio_paragraph_1 = models.TextField()
    bio_paragraph_2 = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    github_username = models.CharField(max_length=100, blank=True)
    linkedin_username = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "About Content"

    def __str__(self):
        return "About Section"


class WhatIBuildItem(models.Model):
    """Items for the 'What I Build' section in About"""
    order = models.PositiveIntegerField(default=0)
    icon_name = models.CharField(max_length=100, help_text="e.g. fa-layer-group, fa-server")
    title = models.CharField(max_length=100)
    description = models.TextField()

    class Meta:
        ordering = ['order']
        verbose_name = "What I Build Item"
        verbose_name_plural = "What I Build Items"

    def __str__(self):
        return self.title


class EngineeringFocusItem(models.Model):
    """Items for the Engineering Focus section"""
    order = models.PositiveIntegerField(default=0)
    icon_name = models.CharField(max_length=100, help_text="e.g. fa-layer-group, fa-database")
    title = models.CharField(max_length=100)
    description = models.TextField()

    class Meta:
        ordering = ['order']
        verbose_name = "Engineering Focus Item"
        verbose_name_plural = "Engineering Focus Items"

    def __str__(self):
        return self.title


class DevelopmentApproachStep(models.Model):
    """Steps for the 'How I approach development' section"""
    order = models.PositiveIntegerField(default=0)
    step_number = models.PositiveIntegerField()
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon_name = models.CharField(max_length=100, help_text="e.g. fa-clipboard-check, fa-hammer")

    class Meta:
        ordering = ['order']
        verbose_name = "Development Approach Step"
        verbose_name_plural = "Development Approach Steps"

    def __str__(self):
        return f"{self.step_number}. {self.title}"


class ContactInfo(models.Model):
    """Singleton model for contact section"""
    heading = models.CharField(max_length=200, default="Let's build something great.")
    subheading = models.TextField(blank=True, help_text="The contact intro paragraph")
    email = models.EmailField()
    github_username = models.CharField(max_length=100, blank=True)
    linkedin_username = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = "Contact Info"

    def __str__(self):
        return "Contact Section"