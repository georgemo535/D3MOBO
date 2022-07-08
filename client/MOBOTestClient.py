import base64
import datetime
from io import BytesIO
import numpy as np
import os
import socket
import sys
import time
import requests
import json

###################
print('\n==============\nMOBO Test Client\n==============\n')
print('\n')

#url = 'https://www.httpbin.org/post'
url = 'http://127.0.0.1:80/cgi/web_service.py'
payload = {'design_params': [0.90,0.30,0.40,0.9,0.25],
'objectives' : [0.8, 3], 
'participant_id':1,
'formal_eval':1 }

# Post request
response = requests.post(url, data=json.dumps(payload))

# print(response.request.url)
# print(response.request.body)
# print(response.request.headers)

# Print response
print(response.text)
