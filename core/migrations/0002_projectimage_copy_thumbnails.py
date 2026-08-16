from django.db import migrations, models


def copy_thumbnails_to_images(apps, schema_editor):
    Project = apps.get_model('core', 'Project')
    ProjectImage = apps.get_model('core', 'ProjectImage')
    for project in Project.objects.exclude(thumbnail=''):
        name = getattr(project.thumbnail, 'name', None)
        if not name:
            continue
        ProjectImage.objects.create(project=project, image=name, order=0)
        project.thumbnail = ''
        project.save(update_fields=['thumbnail'])


def restore_thumbnails(apps, schema_editor):
    Project = apps.get_model('core', 'Project')
    ProjectImage = apps.get_model('core', 'ProjectImage')
    for image in ProjectImage.objects.all().order_by('project_id', 'order'):
        if not image.project.thumbnail:
            image.project.thumbnail = image.image.name
            image.project.save(update_fields=['thumbnail'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='thumbnail',
            field=models.ImageField(blank=True, null=True, upload_to='projects/'),
        ),
        migrations.CreateModel(
            name='ProjectImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='projects/')),
                ('order', models.PositiveIntegerField(default=0)),
                ('project', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='images', to='core.project')),
            ],
            options={
                'ordering': ['order', 'id'],
            },
        ),
        migrations.RunPython(copy_thumbnails_to_images, restore_thumbnails),
        migrations.RemoveField(
            model_name='project',
            name='thumbnail',
        ),
    ]
