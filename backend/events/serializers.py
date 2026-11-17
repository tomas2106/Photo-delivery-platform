from rest_framework import serializers
from .models import Event, Photo


class PhotoSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Photo
        fields = ['id', 'code', 'url', 'order']


class PublicEventListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    requiresPin = serializers.BooleanField(source='requires_pin')
    includedPhotos = serializers.IntegerField(source='included_photos')
    extraPhotoPrice = serializers.IntegerField(source='extra_photo_price')
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
            'isActive',
            'watermarkText',
            'coverImage',
            'photos',
        ]

    def get_photos(self, obj):
        # Si el evento es público (sin PIN), devuelve las fotos de inmediato;
        # si requiere PIN, oculta las URLs hasta que el cliente lo desbloquee.
        if not obj.requires_pin or not obj.pin:
            return PhotoSerializer(obj.photos.all(), many=True).data
        return []


class FullEventSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    requiresPin = serializers.BooleanField(source='requires_pin')
    includedPhotos = serializers.IntegerField(source='included_photos')
    extraPhotoPrice = serializers.IntegerField(source='extra_photo_price')
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
            instance.photos.all().delete()
            for idx, photo in enumerate(photos_data):
                Photo.objects.create(
                    event=instance,
                    code=photo.get('code', f'TOMASPH_{idx + 1:03d}'),
                    url=photo['url'],
                    order=idx,
                )
        return instance