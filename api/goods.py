from rest_framework import viewsets, serializers

from goods.models import GoodsModel


class GoodsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoodsModel
        fields = ('name', 'price', 'img1', 'info')


class GoodAPIView(viewsets.ModelViewSet):
    queryset = GoodsModel.objects.all()
    serializer_class = GoodsSerializer