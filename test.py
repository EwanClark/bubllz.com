import requests

response = requests.get('https://bubllz.com/api/login')

print(response.status_code)
print(response.text)