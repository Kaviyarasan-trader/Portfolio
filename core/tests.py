import base64

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse

from .models import Project, ProjectImage

# Minimal valid 1x1 PNG
PNG = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ'
    'AAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
)


def img(name='image.png'):
    return SimpleUploadedFile(name, PNG, content_type='image/png')


class ProjectImageModelTests(TestCase):

    def test_project_can_exist_with_zero_images(self):
        project = Project.objects.create(
            title='No Image', slug='no-image',
            short_description='s', description='d', tech_stack='Django',
        )
        self.assertEqual(project.images.count(), 0)

    def test_project_supports_multiple_images(self):
        project = Project.objects.create(
            title='Multi', slug='multi',
            short_description='s', description='d', tech_stack='Django',
        )
        ProjectImage.objects.create(project=project, image='projects/a.png', order=0)
        ProjectImage.objects.create(project=project, image='projects/b.png', order=1)
        ProjectImage.objects.create(project=project, image='projects/c.png', order=2)
        self.assertEqual(project.images.count(), 3)
        self.assertEqual([i.order for i in project.images.all()], [0, 1, 2])

    def test_deleting_project_removes_its_images(self):
        project = Project.objects.create(
            title='Del', slug='del',
            short_description='s', description='d', tech_stack='Django',
        )
        ProjectImage.objects.create(project=project, image='projects/x.png', order=0)
        project_id = project.pk
        project.delete()
        self.assertFalse(ProjectImage.objects.filter(project_id=project_id).exists())


class ProjectImageAdminTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_superuser('admin', 'a@example.com', 'pass')
        self.client.force_login(self.user)
        self.project = Project.objects.create(
            title='Test Project', slug='test-project',
            short_description='Short', description='Long', tech_stack='Django, JS',
        )

    def _add_payload(self, **extra):
        payload = {
            'title': 'Temp', 'slug': 'temp-slug',
            'short_description': 'Short', 'description': 'Long',
            'tech_stack': 'Django',
        }
        payload.update(extra)
        return payload

    def test_admin_add_with_zero_images_succeeds(self):
        url = reverse('admin:core_project_add')
        resp = self.client.post(url, self._add_payload(), follow=False)
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(Project.objects.filter(slug='temp-slug').exists())

    def test_admin_add_with_multiple_images_at_once(self):
        url = reverse('admin:core_project_add')
        payload = self._add_payload(
            title='Multi Add', slug='multi-add',
            images=[img('one.png'), img('two.png'), img('three.png')],
        )
        resp = self.client.post(url, payload, follow=False)
        self.assertEqual(resp.status_code, 302)
        project = Project.objects.get(slug='multi-add')
        self.assertEqual(project.images.count(), 3)

    def test_admin_edit_preserves_existing_and_removes_marked(self):
        keep = ProjectImage.objects.create(project=self.project, image='projects/keep.png', order=0)
        ProjectImage.objects.create(project=self.project, image='projects/remove.png', order=1)
        remove = ProjectImage.objects.get(image='projects/remove.png')

        url = reverse('admin:core_project_change', args=[self.project.pk])
        payload = self._add_payload(
            title=self.project.title, slug=self.project.slug,
            short_description=self.project.short_description,
            description=self.project.description,
            tech_stack=self.project.tech_stack,
            images=[img('new.png')],
            delete_images=[str(remove.pk)],
        )
        resp = self.client.post(url, payload, follow=False)
        self.assertEqual(resp.status_code, 302)

        names = set(self.project.images.values_list('image', flat=True))
        self.assertIn('projects/keep.png', names)
        self.assertNotIn('projects/remove.png', names)
        self.assertTrue(any(n.startswith('projects/new') for n in names))
        self.assertTrue(ProjectImage.objects.filter(pk=keep.pk).exists())
        self.assertFalse(ProjectImage.objects.filter(pk=remove.pk).exists())

    def test_admin_edit_without_any_images_keeps_existing(self):
        ProjectImage.objects.create(project=self.project, image='projects/stay.png', order=0)
        url = reverse('admin:core_project_change', args=[self.project.pk])
        payload = self._add_payload(
            title=self.project.title, slug=self.project.slug,
            short_description=self.project.short_description,
            description=self.project.description,
            tech_stack=self.project.tech_stack,
        )
        resp = self.client.post(url, payload, follow=False)
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(self.project.images.count(), 1)
        self.assertEqual(self.project.images.first().image.name, 'projects/stay.png')
