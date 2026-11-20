from django.conf import settings
from django.db.models import F, Sum
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
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
    photo_ids = request.data.get('photoIds', [])
    photo_codes = request.data.get('photoCodes', [])
    subtotal_amount = max(0, int(request.data.get('subtotalAmount', 0)))
    discount_amount = max(0, int(request.data.get('discountAmount', 0)))
    total_amount = max(0, int(request.data.get('totalAmount', 0)))

    order = Order.objects.create(
        event=event,
        client_name=client_name,
        photo_codes=photo_codes,
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


@api_view(['GET'])
def admin_analytics(request):
    if not is_valid_admin(request):
        return Response({'detail': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    total_views = Event.objects.aggregate(total=Sum('views_count'))['total'] or 0
    quoted_revenue = Order.objects.filter(status='pending').aggregate(total=Sum('total_amount'))['total'] or 0
    paid_revenue = Order.objects.filter(status='paid').aggregate(total=Sum('total_amount'))['total'] or 0

    top_events = Event.objects.order_by('-views_count')[:5].values(
        'id', 'title', 'category', 'views_count'
    )

    top_photos_qs = Photo.objects.filter(selection_count__gt=0).select_related('event').order_by('-selection_count')[:8]
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

    recent_orders = OrderSerializer(Order.objects.all()[:25], many=True).data

    return Response({
        'totalViews': total_views,
        'quotedRevenue': quoted_revenue,
        'paidRevenue': paid_revenue,
        'totalOrders': Order.objects.count(),
        'topEvents': list(top_events),
        'topPhotos': top_photos,
        'orders': recent_orders,
    })


@api_view(['PATCH', 'DELETE'])
def admin_order_manage(request, order_id):
    if not is_valid_admin(request):
        return Response({'detail': 'No autorizado'}, status=status.HTTP_401_UNAUTHORIZED)

    order = get_object_or_404(Order, id=order_id)

    if request.method == 'PATCH':
        new_status = request.data.get('status')
        if new_status in ['pending', 'paid']:
            order.status = new_status
            order.save()
        return Response(OrderSerializer(order).data)

    if request.method == 'DELETE':
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)