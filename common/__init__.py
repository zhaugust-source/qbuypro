from redis import Redis


config = {
    'host': '192.168.79.109',
    'port': 6379,
    'db': 4,
    'password': 'dH6L3n0LAP5hbyW0',
    'decode_responses': True
}

rd_client = Redis(**config)

if __name__ == '__main__':
    rd_client.keys('*')