import os
import ssl
import certifi

# Disable OCSP to avoid memory allocation issues on macOS
os.environ['PYMONGO_DISABLE_OCSP'] = '1'

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://user-db:vozsas-wyfBuj-9qusqe@cluster51330.xffvmnd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster51330"

# Create SSL context with certifi certificates
ssl_context = ssl.create_default_context(cafile=certifi.where())

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'), tlsCAFile=certifi.where())

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)