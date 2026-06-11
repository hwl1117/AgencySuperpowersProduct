import sys
import whisper
import json

def transcribe_audio(audio_path):
    try:
        model = whisper.load_model("base")
        result = model.transcribe(audio_path, language="zh")
        return {
            "success": True,
            "text": result["text"],
            "segments": result.get("segments", [])
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: python transcribe.py <audio_path>"}))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    result = transcribe_audio(audio_path)
    print(json.dumps(result, ensure_ascii=False))
