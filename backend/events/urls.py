from django.urls import path
from . import views

urlpatterns = [
    path('admin/verify/', views.verify_admin_pin, name='verify-admin'),
    path('events/', views.event_list_create, name='event-list-create'),
    path('events/<uuid:event_id>/', views.event_detail_manage, name='event-detail-manage'),
    path('events/<uuid:event_id>/unlock/', views.unlock_event, name='unlock-event'),
]