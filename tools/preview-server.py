#!/usr/bin/env python3
"""ビルド結果をローカルで確認するためのサーバー。

GitHub Pages と同じく、見つからないパスには 404.html を返す（ADR-0010）。
python3 -m http.server では素の 404 が返り、SPA の直リンクを確認できないため。

    python3 tools/preview-server.py [ポート]

http://localhost:8899/monmana/ で開く。
"""
import http.server
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
BASE = "/monmana"


class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split("?", 1)[0].split("#", 1)[0]
        if path.startswith(BASE):
            path = path[len(BASE) :]
        return os.path.join(ROOT, path.lstrip("/"))

    def send_error(self, code, message=None, explain=None):
        # GitHub Pages にならい、見つからないパスは 404.html を返す。
        # vite build は dist を空にするため 404.html が無いことがある。
        # デプロイ時はワークフローが作るので、ここでは index.html で代替する
        if code == 404:
            fallback = os.path.join(ROOT, "404.html")
            if not os.path.exists(fallback):
                fallback = os.path.join(ROOT, "index.html")
            if os.path.exists(fallback):
                with open(fallback, "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
        super().send_error(code, message, explain)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    print(f"http://localhost:{port}{BASE}/")
    http.server.HTTPServer(("", port), Handler).serve_forever()
