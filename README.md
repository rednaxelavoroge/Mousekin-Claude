# Clocktown PWA: сборка из APK

    python3 -m venv .venv && . .venv/bin/activate && pip install pillow
    python3 build.py ~/Downloads/andr.apk --out dist
    cd dist && python3 -m http.server 8080      # проверка: http://localhost:8080

Публикация (нужен HTTPS): `npx netlify deploy --prod --dir dist` или `npx vercel dist --prod`.
iPhone: Safari -> Поделиться -> На экран «Домой». Android: Chrome -> Установить приложение.

Опции: `--audio-kbps 64` (сжать озвучку, нужен ffmpeg), `--no-watermark` (убрать знак TigerCreate),
`--max-side 2048`, `--default-lang RU|EN|DE`.
