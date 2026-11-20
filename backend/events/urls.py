from django.urls import path
from . import views

urlpatterns = [
    path('admin/verify/', views.verify_admin_pin, name='verify-admin'),
    path('admin/analytics/', views.admin_analytics, name='admin-analytics'),
    path('admin/orders/<uuid:order_id>/', views.admin_order_manage, name='admin-order-manage'),
    path('events/', views.event_list_create, name='event-list-create'),
    path('events/<uuid:event_id>/', views.event_detail_manage, name='event-detail-manage'),
    path('events/<uuid:event_id>/unlock/', views.unlock_event, name='unlock-event'),
    path('events/<uuid:event_id>/view/', views.track_event_view, name='track-event-view'),
    path('orders/', views.create_order, name='create-order'),
]