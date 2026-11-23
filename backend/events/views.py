from django.conf import settings
from django.db.models import F, Sum, Case, When, Value
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Event, Photo, Order
from .serializers import (
    PublicEventListSerializer,
    FullEventSerializer,
    OrderSerializer,
)
from .cloudinary_utils import delete_cloudinary_urls


def is_valid_admin(request):
    admin_pin = request.headers.get('X-Admin-Pin', '')
    return admin_pin == settings.ADMIN_MASTER_PIN


@api_view(['POST'])
def verify_admin_pin(request):
    pin = request.data.get('pin', '')
    if pin == settings.ADMIN_MASTER_PIN:
        return Response({'valid': True}, status=status.HTTP_200_OK)
    return Response({'detail': 'Contraseña incorrecta'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'POST'])
def event_list_create(request):
    if request.method == 'GET':
        if is_valid_admin(request):
            events = Event.objects.all()
            serializer = FullEventSerializer(events, many=True)
            return Response(serializer.data)

        events = Event.objects.filter(is_active=True)
        serializer = PublicEventListSerializer(events, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        if not is_valid_admin(request):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = FullEventSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            return Response(FullEventSerializer(event).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
def event_detail_manage(request, event_id):
    if not is_valid_admin(request):
        return Response({'detail': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    event = get_object_or_404(Event, id=event_id)

    if request.method == 'PATCH':
        serializer = FullEventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            updated_event = serializer.save()
            return Response(FullEventSerializer(updated_event).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        # Recolectar todas las URLs de Cloudinary del evento (fotos + portada)
        event_urls = list(event.photos.values_list('url', flat=True))
        if event.cover_image:
            event_urls.append(event.cover_image)

        # Proteger las URLs de fotos que pertenecen a pedidos con link habilitado o pagados
        protected_urls = set()
        for order in Order.objects.all():
            if order.delivery_enabled or order.status == 'paid':
                for item in (order.purchased_photos or []):
                    if isinstance(item, dict) and item.get('url'):
                        protected_urls.add(item['url'])

        # Eliminar en Cloudinary SOLO el relleno (las fotos que nadie compró)
        urls_to_delete = list({u for u in event_urls if u and u not in protected_urls})
        cloudinary_result = delete_cloudinary_urls(urls_to_delete)

        # Asegurar snapshot de título en las órdenes vinculadas antes de eliminar el evento
        event.orders.filter(event_title_snapshot='').update(event_title_snapshot=event.title)

        event.delete()
        return Response(
            {
                'deleted': True,
                'cloudinaryCleanup': cloudinary_result,
                'preservedPurchasedPhotos': len(protected_urls),
            },
            status=status.HTTP_200_OK,
        )


@api_view(['POST'])
def unlock_event(request, event_id):
    event = get_object_or_404(Event, id=event_id, is_active=True)

    if not event.requires_pin or not event.pin:
        Event.objects.filter(id=event.id).update(views_count=F('views_count') + 1)
        event.refresh_from_db()
        return Response(FullEventSerializer(event).data)

    pin_sent = str(request.data.get('pin', '')).strip()
    if pin_sent != event.pin:
        return Response(
            {'detail': 'PIN incorrecto. Verifica el código enviado por el fotógrafo.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    Event.objects.filter(id=event.id).update(views_count=F('views_count') + 1)
    event.refresh_from_db()
    return Response(FullEventSerializer(event).data)


@api_view(['POST'])
def track_event_view(request, event_id):
    updated = Event.objects.filter(id=event_id, is_active=True).update(
        views_count=F('views_count') + 1
    )
    if not updated:
        return Response({'detail': 'Evento no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'tracked': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
def create_order(request):
    event_id = request.data.get('eventId')
    event = get_object_or_404(Event, id=event_id, is_active=True)

    client_name = str(request.data.get('clientName', 'Cliente')).strip() or 'Cliente'
    client_phone = str(request.data.get('clientPhone', '')).strip()
    photo_ids = request.data.get('photoIds', [])
    photo_codes = request.data.get('photoCodes', [])
    subtotal_amount = max(0, int(request.data.get('subtotalAmount', 0)))
    discount_amount = max(0, int(request.data.get('discountAmount', 0)))
    total_amount = max(0, int(request.data.get('totalAmount', 0)))

    # Guardar snapshot exacto [{code, url}] de las fotos seleccionadas para que sobreviva si borras el evento
    selected_photos_qs = Photo.objects.filter(event=event, id__in=photo_ids)
    photo_map = {str(p.id): {'code': p.code, 'url': p.url} for p in selected_photos_qs}
    purchased_snapshot = [
        photo_map[str(pid)] for pid in photo_ids if str(pid) in photo_map
    ]

    order = Order.objects.create(
        event=event,
        event_title_snapshot=event.title,
        client_name=client_name,
        client_phone=client_phone,
        photo_codes=photo_codes,
        purchased_photos=purchased_snapshot,
        photos_count=len(photo_codes),
        subtotal_amount=subtotal_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
    )

    if photo_ids:
        Photo.objects.filter(event=event, id__in=photo_ids).update(
            selection_count=F('selection_count') + 1
        )

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


def build_analytics_payload():
    total_views = Event.objects.aggregate(total=Sum('views_count'))['total'] or 0
    quoted_revenue = Order.objects.filter(status='pending').aggregate(total=Sum('total_amount'))['total'] or 0
    paid_revenue = Order.objects.filter(status='paid').aggregate(total=Sum('total_amount'))['total'] or 0

    top_events = Event.objects.order_by('-views_count')[:5].values(
        'id', 'title', 'category', 'views_count'
    )

    top_photos_qs = (
        Photo.objects.filter(selection_count__gt=0)
        .select_related('event')
        .order_by('-selection_count')[:8]
    )
    top_photos = [
        {
            'id': str(p.id),
            'code': p.code,
            'url': p.url,
            'selectionCount': p.selection_count,
            'eventTitle': p.event.title,
        }
        for p in top_photos_qs
    ]

    recent_orders = OrderSerializer(Order.objects.all()[:100], many=True).data

    return {
        'totalViews': total_views,
        'quotedRevenue': quoted_revenue,
        'paidRevenue': paid_revenue,
        'totalOrders': Order.objects.count(),
        'topEvents': list(top_events),
        'topPhotos': top_photos,
        'orders': recent_orders,
    }


@api_view(['GET'])
def admin_analytics(request):
    if not is_valid_admin(request):
        return Response({'detail': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    return Response(build_analytics_payload())


@api_view(['PATCH', 'DELETE'])
def admin_order_manage(request, order_id):
    if not is_valid_admin(request):
        return Response({'detail': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    order = get_object_or_404(Order, id=order_id)

    if request.method == 'PATCH':
        new_status = request.data.get('status')
        if new_status in ['pending', 'paid']:
            order.status = new_status

        delivery_mode = request.data.get('deliveryMode')
        if delivery_mode in ['manual', 'link']:
            order.delivery_mode = delivery_mode
            if delivery_mode == 'manual':
                order.delivery_enabled = False

        if 'deliveryEnabled' in request.data:
            order.delivery_enabled = bool(request.data.get('deliveryEnabled'))
            if order.delivery_enabled:
                order.delivery_mode = 'link'

        if 'totalAmount' in request.data:
            try:
                parsed_total = max(0, int(request.data.get('totalAmount')))
                order.total_amount = parsed_total
                order.subtotal_amount = parsed_total
                order.discount_amount = 0
            except (TypeError, ValueError):
                return Response(
                    {'detail': 'El valor total debe ser un número entero válido.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order.save()
        return Response(OrderSerializer(order).data)

    if request.method == 'DELETE':
        # 1. Descontar selection_count en las fotos de esa orden para que no aparezcan como más pedidas
        purchased_urls = [
            item.get('url')
            for item in (order.purchased_photos or [])
            if isinstance(item, dict) and item.get('url')
        ]

        if order.event is not None:
            if purchased_urls:
                photos_qs = Photo.objects.filter(event=order.event, url__in=purchased_urls)
            elif order.photo_codes:
                photos_qs = Photo.objects.filter(event=order.event, code__in=order.photo_codes)
            else:
                photos_qs = Photo.objects.none()

            photos_qs.update(
                selection_count=Case(
                    When(selection_count__gt=0, then=F('selection_count') - 1),
                    default=Value(0),
                )
            )
        elif purchased_urls:
            # Si el evento padre ya fue eliminado, limpiar sus fotos de Cloudinary al borrar la orden
            delete_cloudinary_urls(purchased_urls)

        order.delete()
        return Response(build_analytics_payload(), status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
def public_delivery_portal(request, token):
    order = get_object_or_404(Order, delivery_token=token)

    if not order.delivery_enabled or order.status != 'paid':
        return Response(
            {
                'detail': 'Este enlace de entrega aún no está habilitado o está pendiente de confirmación de pago.'
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'POST':
        Order.objects.filter(id=order.id).update(downloads_count=F('downloads_count') + 1)
        order.refresh_from_db()
        return Response({'downloadsCount': order.downloads_count})

    event_title = order.event.title if order.event else (order.event_title_snapshot or 'Galería TOMASPH')

    return Response({
        'orderId': str(order.id),
        'orderNumber': str(order.id).split('-')[0].upper(),
        'clientName': order.client_name,
        'eventTitle': event_title,
        'photosCount': order.photos_count,
        'totalAmount': order.total_amount,
        'photos': order.purchased_photos or [],
        'downloadsCount': order.downloads_count,
        'createdAt': order.created_at,
    })