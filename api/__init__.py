from rest_framework import routers

from .user import UserAPIView
from .goods import GoodAPIView
from .active import ActiveAPIView, ActiveGoodsAPIView

# 声明api路由
router = routers.DefaultRouter()

# 向api路由中注册ViewSet
router.register('users', UserAPIView)
router.register('goods', GoodAPIView)
router.register('actives', ActiveAPIView)
router.register('actives_goods', ActiveGoodsAPIView)

