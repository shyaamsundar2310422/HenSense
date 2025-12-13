import requests
base = "http://127.0.0.1:8000"
try:
    r = requests.options(base + "/predict")
    print("OPTIONS", r.status_code)
    print("OPTIONS headers:", dict(r.headers))
except Exception as e:
    print("OPTIONS error", e)

try:
    tiny_png = (b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
                b'\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
                b'\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01'
                b'\xe2!\xbc\x33\x00\x00\x00\x00IEND\xaeB`\x82')
    files = {'file': ('tiny.png', tiny_png, 'image/png')}
    r2 = requests.post(base + "/predict", files=files, data={'conf':'0.25'})
    print("POST", r2.status_code)
    print("POST headers:", dict(r2.headers))
    print("POST text preview:", r2.text[:400])
except Exception as e:
    print("POST error", e)
