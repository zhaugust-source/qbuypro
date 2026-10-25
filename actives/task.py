import time

from celery import shared_task
from django.core.cache import cache

@shared_task
def qbuy_task(goods_id, user_id):
    time.sleep(10)
    # 判断是否已抢完
    if cache.is_qbuyable():
        pass
    else:
        return '%s 抢购 %s 失败: 每天限一次' % (goods_id, user_id)

    return '%s 抢购 %s 失败' % (goods_id, user_id)