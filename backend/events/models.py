import uuid
from django.db import models


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100, blank=True, default='')
    date = models.CharField(max_length=100, default='Fecha por confirmar')
    location = models.CharField(max_length=150, default='Colombia')
    requires_pin = models.BooleanField(default=True)
    pin = models.CharField(max_length=50, blank=True, default='')
    included_photos = models.PositiveIntegerField(default=40)
    extra_photo_price = models.PositiveIntegerField(default=2000)

    # Descuento por volumen configurable por evento
    volume_discount_enabled = models.BooleanField(default=False)
    volume_discount_min_photos = models.PositiveIntegerField(default=5)
    volume_discount_percent = models.PositiveIntegerField(default=15)

    # Analítica de visitas
    views_count = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    watermark_text = models.CharField(max_length=100, default='tomasph_photos')
    cover_image = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.category})"


class Photo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, related_name='photos', on_delete=models.CASCADE)
    code = models.CharField(max_length=100)
    url = models.TextField()
    order = models.PositiveIntegerField(default=0)
    selection_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return f"{self.code} - {self.event.title}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Cotizado / Pendiente'),
        ('paid', 'Pagado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, related_name='orders', on_delete=models.CASCADE)
    client_name = models.CharField(max_length=150, default='Cliente')
    photo_codes = models.JSONField(default=list)
    photos_count = models.PositiveIntegerField(default=0)
    subtotal_amount = models.PositiveIntegerField(default=0)
    discount_amount = models.PositiveIntegerField(default=0)
    total_amount = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.client_name} - {self.event.title} (${self.total_amount})"