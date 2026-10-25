from django.urls import path

from user.views import user_api, user_api_detail, UserAPIView

app_name = 'user'
urlpatterns = [
    path('api/', UserAPIView.as_view(), name='api'),
    path('api/<pk>', user_api_detail, name='api_detail'),
]