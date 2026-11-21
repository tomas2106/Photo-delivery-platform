from rest_framework import serializers
from .models import Event, Photo, Order


class PhotoSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    selectionCount = serializers.IntegerField(source='selection_count', read_only=True)

    class Meta:
        model = Photo
        fields = ['id', 'code', 'url', 'order', 'selectionCount']


class PublicEventListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    requiresPin = serializers.BooleanField(source='requires_pin')
    includedPhotos = serializers.IntegerField(source='included_photos')
    extraPhotoPrice = serializers.IntegerField(source='extra_photo_price')
    volumeDiscountEnabled = serializers.BooleanField(source='volume_discount_enabled')
    volumeDiscountMinPhotos = serializers.IntegerField(source='volume_discount_min_photos')
    volumeDiscountPercent = serializers.IntegerField(source='volume_discount_percent')
    viewsCount = serializers.IntegerField(source='views_count', read_only=True)
    isActive = serializers.BooleanField(source='is_active')
    watermarkText = serializers.CharField(source='watermark_text')
    coverImage = serializers.CharField(source='cover_image')
    photos = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'category',
            'subcategory',
            'date',
            'location',
            'requiresPin',
            'includedPhotos',
            'extraPhotoPrice',
            'volumeDiscountEnabled',
            'volumeDiscountMinPhotos',
            'volumeDiscountPercent',
            'viewsCount',
            'isActive',
            'watermarkText',
            'coverImage',
            'photos',
        ]

    def get_photos(self, obj):
        if not obj.requires_pin or not obj.pin:
            return PhotoSerializer(obj.photos.all(), many=True).data
        return []


class FullEventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    requiresPin = serializers.BooleanField(source='requires_pin')
    includedPhotos = serializers.IntegerField(source='included_photos')
    extraPhotoPrice = serializers.IntegerField(source='extra_photo_price')
    volumeDiscountEnabled = serializers.BooleanField(source='volume_discount_enabled')
    volumeDiscountMinPhotos = serializers.IntegerField(source='volume_discount_min_photos')
    volumeDiscountPercent = serializers.IntegerField(source='volume_discount_percent')
    viewsCount = serializers.IntegerField(source='views_count', read_only=True)
    isActive = serializers.BooleanField(source='is_active')
    watermarkText = serializers.CharField(source='watermark_text')
    coverImage = serializers.CharField(source='cover_image')
    photos = PhotoSerializer(many=True, required=False)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'category',
            'subcategory',
            'date',
            'location',
            'requiresPin',
            'pin',
            'includedPhotos',
            'extraPhotoPrice',
            'volumeDiscountEnabled',
            'volumeDiscountMinPhotos',
            'volumeDiscountPercent',
            'viewsCount',
            'isActive',
            'watermarkText',
            'coverImage',
            'photos',
        ]

    def create(self, validated_data):
        photos_data = validated_data.pop('photos', [])
        event = Event.objects.create(**validated_data)
        for idx, photo in enumerate(photos_data):
            Photo.objects.create(
                event=event,
                code=photo.get('code', f'TOMASPH_{idx + 1:03d}'),
                url=photo['url'],
                order=idx,
            )
        return event

    def update(self, instance, validated_data):
        photos_data = validated_data.pop('photos', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if photos_data is not None:
            existing_counts = {
                p.url: p.selection_count for p in instance.photos.all()
            }
            instance.photos.all().delete()
            for idx, photo in enumerate(photos_data):
                Photo.objects.create(
                    event=instance,
                    code=photo.get('code', f'TOMASPH_{idx + 1:03d}'),
                    url=photo['url'],
                    order=idx,
                    selection_count=existing_counts.get(photo['url'], 0),
                )
        return instance


class OrderSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    eventId = serializers.SerializerMethodField()
    eventTitle = serializers.SerializerMethodField()
    clientName = serializers.CharField(source='client_name')
    clientPhone = serializers.CharField(source='client_phone', required=False, allow_blank=True)
    photoCodes = serializers.ListField(source='photo_codes')
    purchasedPhotos = serializers.ListField(source='purchased_photos', read_only=True)
    photosCount = serializers.IntegerField(source='photos_count')
    subtotalAmount = serializers.IntegerField(source='subtotal_amount')
    discountAmount = serializers.IntegerField(source='discount_amount')
    totalAmount = serializers.IntegerField(source='total_amount')
    deliveryMode = serializers.CharField(source='delivery_mode')
    deliveryToken = serializers.CharField(source='delivery_token', read_only=True)
    deliveryEnabled = serializers.BooleanField(source='delivery_enabled')
    downloadsCount = serializers.IntegerField(source='downloads_count', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'eventId',
            'eventTitle',
            'clientName',
            'clientPhone',
            'photoCodes',
            'purchasedPhotos',
            'photosCount',
            'subtotalAmount',
            'discountAmount',
            'totalAmount',
            'status',
            'deliveryMode',
            'deliveryToken',
            'deliveryEnabled',
            'downloadsCount',
            'createdAt',
        ]

    def get_eventId(self, obj):
        return str(obj.event.id) if obj.event else None

    def get_eventTitle(self, obj):
        if obj.event:
            return obj.event.title
        return obj.event_title_snapshot or 'Evento archivado'