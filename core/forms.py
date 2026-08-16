from django import forms
from django.forms import ImageField
from .models import ContactMessage, Project, ProjectImage, Technology


class ContactForm(forms.ModelForm):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'subject', 'message']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control premium-input', 'placeholder': 'Your Name'}),
            'email': forms.EmailInput(attrs={'class': 'form-control premium-input', 'placeholder': 'Your Email'}),
            'subject': forms.TextInput(attrs={'class': 'form-control premium-input', 'placeholder': 'Subject'}),
            'message': forms.Textarea(attrs={'class': 'form-control premium-input', 'placeholder': 'Your Message', 'rows': 5}),
        }


class MultiFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


class MultiImageField(forms.FileField):
    widget = MultiFileInput(attrs={'accept': 'image/*'})

    def clean(self, data, initial=None):
        files = data if isinstance(data, (list, tuple)) else ([data] if data else [])
        cleaned = []
        for f in files:
            if not f:
                continue
            cleaned.append(self._clean_one(f))
        return cleaned

    def _clean_one(self, f):
        return ImageField(required=False).clean(f)


class ProjectImageSelectMultiple(forms.CheckboxSelectMultiple):
    template_name = 'admin/core/widgets/project_image_select.html'

    def create_option(self, name, value, label, selected, index, subindex=None, attrs=None):
        option = super().create_option(name, value, label, selected, index, subindex, attrs)
        try:
            image = ProjectImage.objects.get(pk=value)
            option['attrs']['data-thumb'] = image.image.url
        except (ProjectImage.DoesNotExist, ValueError, TypeError):
            pass
        return option


class ProjectAdminForm(forms.ModelForm):
    images = MultiImageField(
        required=False,
        label='Project Images (Optional)',
        help_text='Select one or more images at once. New images are added to the project when you save.',
    )
    delete_images = forms.ModelMultipleChoiceField(
        required=False,
        label='Remove existing images',
        help_text='Tick an image to delete it permanently when you save.',
        widget=ProjectImageSelectMultiple,
        queryset=ProjectImage.objects.none(),
    )

    class Meta:
        model = Project
        fields = [
            'title', 'slug', 'short_description', 'description', 'problem', 'approach', 'outcome',
            'tech_stack', 'github_link', 'live_link', 'featured', 'order', 'images', 'delete_images',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['delete_images'].queryset = self.instance.images.all()