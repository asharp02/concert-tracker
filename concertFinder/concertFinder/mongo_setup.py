from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import environ

env = environ.Env()
environ.Env.read_env()

uri = f"mongodb+srv://adriansharpe148:{env('MONGO_PASS')}@cluster0.exyeuin.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(uri, server_api=ServerApi("1"))
db = client["gigmapr"]
collection = db["events"]
