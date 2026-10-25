from django.http import JsonResponse
from django.shortcuts import render
from django.views.generic import TemplateView
from .models import ActiveModel, ActiveGoodsModel
from goods.models import GoodsModel
from .task import qbuy_task
import common.cache  as common_cache

# Create your views here.
class ActiveGoodsView(TemplateView):
    template_name = 'goods_list.html'

    def get_context_data(self, **kwargs):
        context = super(ActiveGoodsView, self).get_context_data(**kwargs)
        active = ActiveModel.objects.get(pk=1)
        context['active'] = active

        active_goods = (
            ActiveGoodsModel.objects
            .filter(active=active)
            .select_related('goods')
        )
        goods = [
            {
                'id': ag.goods.id,
                'name': ag.goods.name,
                'price': round(float(ag.rate_price) * ag.rate, 2),
                'info': ag.goods.info,
                'img1': ag.goods.img1.url if ag.goods.img1 else '',
                'category': ag.goods.category,
                'category_name': ag.goods.get_category_display(),
            }
            for ag in active_goods
        ]
        context['goods_json'] = goods
        cat_names = dict(GoodsModel._meta.get_field('category').flatchoices)
        present = {g['category'] for g in goods}
        context['cats'] = [
            {'value': v, 'name': n} for v, n in cat_names.items() if v in present
        ]
        return context


def qbuy_api(request, goods_id):
    # 验证当前用户是否已登录
    login_user = request.session.get('login_user', None)
    if not login_user:
        return JsonResponse({
            'code': 100,
            'msg': '当前用户未登录'
        })
    # login_user = {'id': 11, 'name': 'zhangsan'
    user_id = login_user.get('id')

    # 验证换购商品所在的活动是否已结束

    qbuy_task.delay(user_id ,goods_id)

    return JsonResponse({
        'code': 201,
        'msg': '抢购中'
    })

def query_qbuy_api(request, goods_id):
    login_user = request.session.get('login_user', None)
    if not login_user:
        return JsonResponse({
            'code': 100,
            'msg': '当前用户未登录'
        })

    user_id = login_user.get('id')
    if common_cache.exist_qbuy(user_id):
        qbuy_goods_id = common_cache.get_qbuy(user_id)

        if goods_id == qbuy_goods_id:
            return JsonResponse({
                'code': 200,
                'msg': '抢购成功',
        })
        else:
            return JsonResponse({
                'code': 202,
                'msg': '每天只一次抢购'
            })
    elif common_cache.is_qbuyable():
        return JsonResponse({
            'code': 201,
            'msg': '抢购中'
        })
    else:
        return JsonResponse({
            'code': 300,
            'msg': '抢购失败',
        })