import asyncio
import os
import hashlib
from aiohttp import web
import edge_tts

CACHE_DIR = os.path.join(os.path.dirname(__file__), '.audio_cache')
os.makedirs(CACHE_DIR, exist_ok=True)

DEFAULT_VOICE = "ar-EG-SalmaNeural"

async def handle_tts(request):
    text = request.query.get('text', '').strip()
    voice = request.query.get('voice', DEFAULT_VOICE)
    rate = request.query.get('rate', '+0%')

    if not text:
        return web.Response(status=400, text="Missing text parameter")

    # Generate cache key
    cache_key = hashlib.md5(f"{voice}_{rate}_{text}".encode('utf-8')).hexdigest()
    cache_path = os.path.join(CACHE_DIR, f"{cache_key}.mp3")

    # If cached, return file immediately
    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        with open(cache_path, 'rb') as f:
            data = f.read()
        return web.Response(body=data, content_type='audio/mpeg', headers={'Cache-Control': 'public, max-age=86400'})

    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(cache_path)

        with open(cache_path, 'rb') as f:
            data = f.read()
        return web.Response(body=data, content_type='audio/mpeg', headers={'Cache-Control': 'public, max-age=86400'})
    except Exception as e:
        print(f"Error in TTS: {e}")
        return web.Response(status=500, text=str(e))

async def handle_voices(request):
    voices = [
        {"id": "ar-EG-SalmaNeural", "name": "سلمى - مذيعة إخبارية مصرية (صوت بشري ناعم)", "gender": "Female", "locale": "مصر"},
        {"id": "ar-EG-ShakirNeural", "name": "شاكر - معلق وثائقي إذاعي مصري (فخم ورصين)", "gender": "Male", "locale": "مصر"},
        {"id": "ar-SA-HamedNeural", "name": "حامد - مذيع رسمي سعودي وخليجي (هادئ ووقور)", "gender": "Male", "locale": "السعودية"},
        {"id": "ar-SA-ZariyahNeural", "name": "زارية - مذيعة بودكاست خليجية (طبيعية وواضحة)", "gender": "Female", "locale": "السعودية"},
        {"id": "ar-AE-FatimaNeural", "name": "فاطمة - مذيعة إماراتية (صوت إعلامي مميز)", "gender": "Female", "locale": "الإمارات"},
        {"id": "ar-AE-HamdanNeural", "name": "حمدان - معلق إماراتي (واثق وقوي)", "gender": "Male", "locale": "الإمارات"},
        {"id": "ar-JO-TaimNeural", "name": "تيم - معلق أردني وشامي (نبرة شابة وحماسية)", "gender": "Male", "locale": "الأردن"},
        {"id": "ar-JO-SanaNeural", "name": "سناء - مذيعة أردنية وشامية (هادئة وواضحة)", "gender": "Female", "locale": "الأردن"},
        {"id": "en-US-JennyNeural", "name": "Jenny - Natural US English Host", "gender": "Female", "locale": "US"},
        {"id": "en-US-GuyNeural", "name": "Guy - Natural US English Host", "gender": "Male", "locale": "US"}
    ]
    return web.json_response(voices)

app = web.Application()
app.router.add_get('/tts', handle_tts)
app.router.add_get('/voices', handle_voices)

if __name__ == '__main__':
    print("Starting Free Human Neural TTS Service on port 5055...")
    web.run_app(app, port=5055)
