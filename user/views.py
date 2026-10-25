from django.contrib.auth.handlers.modwsgi import check_password
from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from api.user import UserModelSerializer
from goods.models import GoodsModel
from django.views import View
from .models import UserModel
from rest_framework.decorators import api_view


# Create your views here.

class LoginView(View):
    def get(self,request):
        return render(request, 'login.html')

    def post(self,request):
        error_msg = '用户口令出错'
        name=request.POST.get('name', None)
        password=request.POST.get('password', None)

        if all((name,password)):
            user_qs = UserModel.objects.filter(name=name)
            if user_qs.exists():
                user = user_qs.first()
                if check_password(password, user.auth_key):
                    request.session['login_user'] = {
                        'id': user.id,
                        'name': user.phone,
                    }
            else:
                error_msg = '用户不存在，请先注册'

        return render(request, 'login.html', locals())


class UserAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        datas = UserModel.objects.all()
        serializer = UserModelSerializer(datas, many=True)

        return Response(serializer.data)

    def post(self,request):
        serializer = UserModelSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailAPI(APIView):
    pass

@api_view(['GET', 'POST'])
def user_api(request):
    if request.method == 'GET':
        datas = UserModel.objects.all()
        serializer = UserModelSerializer(datas, many=True)
        return Response(serializer.data)

    else:
        serializer = UserModelSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def user_api_detail(request, pk):
    try:
        instance = UserModel.objects.get(pk=pk)
    except UserModel.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserModelSerializer(instance)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UserModelSerializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

