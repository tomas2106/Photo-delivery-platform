import uuid
import secrets
from django.db import models


def generate_delivery_token():
    return secrets.token_urlsafe(12)


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

    # Opciones modulares por evento (filtro horario EXIF y fecha límite)
    time_filter_enabled = models.BooleanField(default=False)
    expires_at = models.DateField(null=True, blank=True)

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
    captured_hour = models.PositiveSmallIntegerField(null=True, blank=True)
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

    DELIVERY_MODE_CHOICES = [
        ('manual', 'Manual (Drive / WhatsApp)'),
        ('link', 'Link de descarga en plataforma'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # SET_NULL para que al borrar un evento NUNCA se borren los ingresos ni los pedidos
    event = models.ForeignKey(
        Event,
        related_name='orders',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    event_title_snapshot = models.CharField(max_length=255, blank=True, default='')
    client_name = models.CharField(max_length=150, default='Cliente')
    client_phone = models.CharField(max_length=40, blank=True, default='')

    # Lista de códigos y snapshot completo [{code, url}] para que sobreviva si borras el evento
    photo_codes = models.JSONField(default=list)
    purchased_photos = models.JSONField(default=list)

    photos_count = models.PositiveIntegerField(default=0)
    subtotal_amount = models.PositiveIntegerField(default=0)
    discount_amount = models.PositiveIntegerField(default=0)
    total_amount = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Control de entrega automática por link único
    delivery_mode = models.CharField(
        max_length=20, choices=DELIVERY_MODE_CHOICES, default='manual'
    )
    delivery_token = models.CharField(
        max_length=64, blank=True, default=''
    )
    delivery_enabled = models.BooleanField(default=False)
    downloads_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.delivery_token:
            self.delivery_token = generate_delivery_token()
        super().save(*args, **kwargs)

    def __str__(self):
        title = self.event.title if self.event else (self.event_title_snapshot or 'Evento eliminado')
        return f"{self.client_name} - {title} (${self.total_amount})"