from django.contrib.auth.hashers import make_password
from django.db.models.signals import pre_save
from django.dispatch import receiver


@receiver(pre_save, sender='user.UserModel')
def filter_user(sender, **kwargs):
    obj = kwargs.get('instance')
    if len(obj.auth_key) < 50:
        obj.auth_key = make_password(obj.auth_key)