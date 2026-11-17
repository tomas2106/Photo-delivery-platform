from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Event
from .serializers import PublicEventListSerializer, FullEventSerializer


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
        # Si viene con cabecera de Admin válida, devuelve TODOS los eventos (incluidos inhabilitados y PINs)
        if is_valid_admin(request):
            events = Event.objects.all()
            serializer = FullEventSerializer(events, many=True)
            return Response(serializer.data)

        # Vista pública: solo eventos activos y sin exponer los PINs
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
        return Response(FullEventSerializer(event).data)

    pin_sent = str(request.data.get('pin', '')).strip()
    if pin_sent != event.pin:
        return Response(
            {'detail': 'PIN incorrecto. Verifica el código enviado por el fotógrafo.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(FullEventSerializer(event).data)