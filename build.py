#!/usr/bin/env python3
"""
Конвертер Tigerbooks/Oskar picture book (APK 2016-17) -> современный PWA.

Использование:
    python3 build.py ~/Downloads/andr.apk              # прямо из APK
    python3 build.py ~/Downloads/andr_x                # из распакованной папки
    python3 build.py ~/Downloads/andr.apk --out dist   # папка результата (по умолчанию ./dist)

Все иллюстрации, озвучка, тексты, тайминги слов и покадровые анимации берутся
из оригинала без изменений. Заново написан только движок ридера (src/).

Зависимости: Python 3.8+, Pillow (pip install pillow). ffmpeg нужен только при --audio-kbps.
"""
import argparse
import concurrent.futures as cf
import html as htmlmod
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    from PIL import Image
except ImportError:
    sys.exit("Не найден Pillow. Установите: pip install pillow")

HERE = Path(__file__).resolve().parent
CANVAS_W, CANVAS_H = 1024, 768
LANGS = ("EN", "RU", "DE")
warnings = []


def warn(msg):
    warnings.append(msg)


# ----------------------------------------------------------------- источники

def locate_sources(src):
    src = Path(src).expanduser()
    if not src.exists():
        sys.exit("Не найден путь: %s" % src)
    if src.is_file():
        if src.suffix.lower() not in (".apk", ".zip"):
            sys.exit("Ожидается .apk или папка с распакованным APK")
        tmp = Path(tempfile.mkdtemp(prefix="apk_"))
        print("Распаковка %s ..." % src.name)
        with zipfile.ZipFile(src) as z:
            for n in z.namelist():
                if n.startswith("assets/ePub/") or n.startswith("assets/UI/"):
                    z.extract(n, tmp)
        src = tmp
    for cand in (src / "assets" / "ePub", src / "ePub", src):
        if (cand / "OEBPS" / "content.opf").exists():
            return cand
    sys.exit("Не найден OEBPS/content.opf внутри %s" % src)


# ----------------------------------------------------------------------- OPF

def parse_opf(epub):
    text = (epub / "OEBPS" / "content.opf").read_text(encoding="utf-8", errors="replace")
    items = re.findall(r'<item\s+id="([^"]+)"\s+href="([^"]+)"\s+media-type="([^"]+)"', text)
    by_id = {i: h for i, h, _ in items}
    spine = re.findall(r'<itemref\s+idref="([^"]+)"', text)
    title = re.search(r"<dc:title>(.*?)</dc:title>", text, re.S)
    creator = re.search(r"<dc:creator>(.*?)</dc:creator>", text, re.S)
    cover_id = re.search(r'<meta\s+name="cover"\s+content="([^"]+)"', text)
    return {
        "by_id": by_id,
        "spine_hrefs": [by_id[s] for s in spine if s in by_id and by_id[s].endswith(".html")],
        "title": htmlmod.unescape(title.group(1).strip()) if title else "Picture book",
        "author": htmlmod.unescape(creator.group(1).strip()) if creator else "",
        "cover": by_id.get(cover_id.group(1)) if cover_id else None,
    }


# ---------------------------------------------------------------------- HTML

OVERLAY_RE = re.compile(
    r'<div class="([^"]*)"\s+oskar:class="([^"]*)"\s+oskar:id="([^"]*)"(.*?)>(.*?)</div>', re.S)
ATTR_RE = re.compile(r'([\w:-]+)="([^"]*)"')
TOKEN_RE = re.compile(r'<span id="([^"]+)">(.*?)</span>|<br\s*/?>', re.S)


def pair(v, default=(0.0, 0.0)):
    try:
        a = [float(x.rstrip("%")) for x in v.split()]
        return (a[0], a[1]) if len(a) >= 2 else default
    except Exception:
        return default


def num(v, d=3):
    x = round(float(v), d)
    return int(x) if x == int(x) else x


def lang_of(cls):
    m = re.search(r"\blang(EN|RU|DE)\b", cls)
    return m.group(1) if m else ""


def parse_scene_html(path, no_watermark):
    t = path.read_text(encoding="utf-8", errors="replace")
    root = re.search(r'<div class="image"[^>]*>', t)
    rattrs = dict(ATTR_RE.findall(root.group(0))) if root else {}
    x1, y1, x2, y2 = [int(v) for v in rattrs.get("region", "0_0_1024_576").split("_")]
    objs, texts = [], {}
    stripped = t
    for m in OVERLAY_RE.finditer(t):
        cls, ocls, oid, rest, body = m.groups()
        stripped = stripped.replace(m.group(0), "")
        a = dict(ATTR_RE.findall(rest))
        lang = lang_of(cls)
        if ocls == "text-overlay":
            tokens, n = [], 0
            for tm in TOKEN_RE.finditer(body):
                if tm.group(1):
                    tokens.append(htmlmod.unescape(re.sub(r"<[^>]+>", "", tm.group(2)).strip()))
                    n += 1
                else:
                    tokens.append("\n")
            style = re.search(r"font-size:\s*([\d.]+)px;[^\"]*line-height:\s*([\d.]+)px", body)
            texts[lang] = {
                "id": oid,
                "color": a.get("oskar:highlightcolor", "#91bac1"),
                "fs": float(style.group(1)) if style else 26.0,
                "lh": float(style.group(2)) if style else 40.0,
                "tok": tokens,
            }
            continue
        if no_watermark and oid.lower().startswith("watermark"):
            continue
        w_pct, h_pct = pair(a.get("oskar:size", "0 0"))
        x_pct, y_pct = pair(a.get("oskar:position", "0 0"))
        ax, ay = pair(a.get("oskar:anchor", "50 50"), (50.0, 50.0))
        sx, sy = pair(a.get("oskar:scale", "1 1"), (1.0, 1.0))
        img = re.search(r'<img src="([^"]+)"', body)
        objs.append({
            "i": oid,
            "src": img.group(1) if img else None,
            "x": num(x_pct * CANVAS_W / 100, 2), "y": num(y_pct * CANVAS_H / 100, 2),
            "w": num(w_pct * CANVAS_W / 100, 2), "h": num(h_pct * CANVAS_H / 100, 2),
            "a": [num(ax / 100, 5), num(ay / 100, 5)],
            "r": num(a.get("oskar:rotation", "0"), 4),
            "sx": num(sx, 5), "sy": num(sy, 5),
            "o": num(a.get("oskar:opacity", "1"), 4),
            "l": lang,
        })
    bg = re.search(r'<img src="([^"]+)"', stripped)
    return {
        "region": [x1, y1, x2 - x1, y2 - y1],
        "tb": {
            "visible": rattrs.get("oskar:textblade_visible", "yes") == "yes",
            "center": float(rattrs.get("oskar:textblade_scene_center", "70")),
            "maxH": float(rattrs.get("oskar:textblade_max_height", "50")),
        },
        "bg": bg.group(1) if bg else None,
        "objs": objs,
        "texts": texts,
    }


# --------------------------------------------------------------------- SMIL

def clock(v):
    v = v.strip()
    if v.endswith("ms"):
        return float(v[:-2]) / 1000.0
    if v.endswith("s"):
        v = v[:-1]
    return float(v)


def parse_smil(path):
    """-> {lang: {'audio': href, 'dur': sec, 'words': {idx: [b, e]}}}"""
    out = {}
    if not path.exists():
        return out
    t = path.read_text(encoding="utf-8", errors="replace")
    pat = re.compile(
        r'<par[^>]*>\s*<text src="([^"]+)"\s*></text>\s*<audio src="([^"]+)"\s+clipBegin="([^"]+)"\s+clipEnd="([^"]+)"',
        re.S)
    for src, audio, b, e in pat.findall(t):
        frag = src.split("#")[-1]
        m = re.match(r"text\d+(EN|RU|DE)(?:_word(\d+))?$", frag)
        if not m:
            continue
        lang, widx = m.group(1), m.group(2)
        d = out.setdefault(lang, {"audio": audio, "dur": 0.0, "words": {}})
        if widx is None:
            d["audio"], d["dur"] = audio, clock(e)
        else:
            d["words"][int(widx)] = [round(clock(b), 3), round(clock(e), 3)]
    return out


def parse_labels(epub, scene, lang):
    p = epub / "OEBPS" / "labeldaten" / ("%s__text01%s.txt" % (scene, lang))
    res = {}
    if not p.exists():
        return res
    for i, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines()):
        parts = line.split("\t")
        if len(parts) >= 2:
            try:
                res[i] = [round(float(parts[0]), 3), round(float(parts[1]), 3)]
            except ValueError:
                pass
    return res


# ------------------------------------------------------------------- анимации

def encode_frames(frames):
    flat = []
    for fm in frames:
        mask, vals = 0, []
        at = fm.attrib
        if "p" in at:
            mask |= 1
            px, py = [float(v) for v in at["p"].split()]
            vals += [num(px, 2), num(py, 2)]
        if "r" in at:
            mask |= 2
            vals.append(num(at["r"], 3))
        if "s" in at:
            mask |= 4
            sx, sy = [float(v) for v in at["s"].split()]
            vals += [num(sx, 4), num(sy, 4)]
        if "a" in at:
            mask |= 8
            vals.append(num(at["a"], 3))
        m = int(float(at.get("m", "1")))
        flat += [m, mask] + vals
    return flat


def parse_anim(path):
    root = ET.parse(path).getroot()
    rate = None
    seqs, seq_index, anims = [], {}, {}
    for a in root.iter("animation"):
        tracks = []
        for o in a.iter("object"):
            steps = o.find("steps")
            fr = steps.find("frames") if steps is not None else None
            if fr is None:
                continue
            if rate is None:
                rate = float(fr.get("rate", "0.05"))
            elif abs(float(fr.get("rate", "0.05")) - rate) > 1e-9:
                warn("%s: разная частота кадров, использую первую" % path.name)
            flat = encode_frames(list(fr))
            key = tuple(flat)
            if key not in seq_index:
                seq_index[key] = len(seqs)
                seqs.append(flat)
            rep = int(steps.get("repeat", a.get("repeat", "1")))
            tracks.append([o.get("id"), seq_index[key], rep])
        anims[a.get("id")] = {"l": a.get("lang", ""), "r": int(a.get("repeat", "1")), "t": tracks}
    return anims, seqs, rate if rate is not None else 0.05


# --------------------------------------------------------------------- логика

def parse_logic(path):
    root = ET.parse(path).getroot()
    per_scene = {}
    for o in root.findall("obj"):
        m = re.match(r"Szene_(\d+)", o.get("id", ""))
        if not m:
            continue
        sc = per_scene.setdefault(int(m.group(1)), {"touch": {}, "start": []})
        for ev in o.findall("event"):
            for ac in ev.findall("action"):
                anim, snd = ac.get("animation"), ac.get("sound")
                loop = ac.get("loop_sound") == "yes"
                if ev.get("type") == "touch":
                    lst = sc["touch"].setdefault(o.get("id"), [])
                    item = [anim, snd, 1 if loop else 0]
                    if item not in lst:
                        lst.append(item)
                elif ev.get("type") == "start":
                    item = [anim, snd, 1 if loop else 0]
                    if item not in sc["start"]:
                        sc["start"].append(item)
    return root, per_scene


# --------------------------------------------------------------------- медиа

def webp_job(args):
    src, dst, quality, max_side = args
    try:
        im = Image.open(src)
        im.load()
        has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
        im = im.convert("RGBA" if has_alpha else "RGB")
        if max_side and max(im.size) > max_side:
            k = max_side / float(max(im.size))
            im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        Path(dst).parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, "WEBP", quality=quality, method=4, alpha_quality=100)
        return (src, dst, True, None)
    except Exception as e:  # noqa
        return (src, dst, False, str(e))


def thumb_job(args):
    src, dst, w = args
    try:
        im = Image.open(src)
        im.load()
        im = im.convert("RGB")
        k = w / float(im.width)
        im = im.resize((w, max(1, round(im.height * k))), Image.LANCZOS)
        Path(dst).parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, "WEBP", quality=72, method=4)
        return (src, dst, True, None)
    except Exception as e:  # noqa
        return (src, dst, False, str(e))


def make_icons(cover_path, out):
    icons = Path(out) / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    try:
        im = Image.open(cover_path).convert("RGB")
    except Exception:
        im = Image.new("RGB", (512, 512), (22, 26, 40))
    side = min(im.size)
    left, top = (im.width - side) // 2, (im.height - side) // 2
    sq = im.crop((left, top, left + side, top + side))
    for size, name in ((512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")):
        sq.resize((size, size), Image.LANCZOS).save(icons / name)
    # maskable: картинка в безопасной зоне 80% на фоне цвета края
    edge = sq.resize((1, 1), Image.BOX).getpixel((0, 0))
    mk = Image.new("RGB", (512, 512), edge)
    inner = sq.resize((410, 410), Image.LANCZOS)
    mk.paste(inner, (51, 51))
    mk.save(icons / "icon-maskable-512.png")
    return "#%02x%02x%02x" % edge


def audio_job(args):
    src, dst, kbps = args
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    if not kbps:
        shutil.copyfile(src, dst)
        return (src, dst, True, None)
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vn",
                        "-codec:a", "libmp3lame", "-b:a", "%dk" % kbps, str(dst)],
                       capture_output=True, text=True)
    if r.returncode != 0:
        shutil.copyfile(src, dst)
        return (src, dst, False, r.stderr.strip()[:200])
    return (src, dst, True, None)


# ----------------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", help="путь к .apk или к распакованной папке")
    ap.add_argument("--out", default="dist", help="папка результата (по умолчанию ./dist)")
    ap.add_argument("--quality", type=int, default=88, help="качество WebP 1-100 (по умолчанию 88)")
    ap.add_argument("--max-side", type=int, default=0, help="ограничить большую сторону картинок, px (0 = без ограничения)")
    ap.add_argument("--audio-kbps", type=int, default=0, help="перекодировать mp3 в N kbps (нужен ffmpeg); 0 = копировать как есть")
    ap.add_argument("--no-watermark", action="store_true", help="не выводить водяной знак TigerCreate на страницах")
    ap.add_argument("--default-lang", default="RU", choices=LANGS, help="язык по умолчанию")
    ap.add_argument("--workers", type=int, default=max(2, (os.cpu_count() or 2)))
    args = ap.parse_args()

    t0 = time.time()
    epub = locate_sources(args.source)
    assets_dir = epub.parent
    oebps = epub / "OEBPS"
    out = Path(args.out).expanduser().resolve()
    if out.exists():
        shutil.rmtree(out)
    (out / "data").mkdir(parents=True)

    opf = parse_opf(epub)
    if args.audio_kbps and not shutil.which("ffmpeg"):
        sys.exit("--audio-kbps требует ffmpeg (brew install ffmpeg)")

    logic_root, logic = parse_logic(oebps / "anim" / "logic.lxml")
    hint = {k[5:]: v for k, v in logic_root.attrib.items() if k.startswith("hint_")}

    img_map = {}      # исходный href -> выходной путь (относительно dist)
    snd_map = {}      # исходный href -> выходной путь
    scenes_meta = []
    all_assets = {"common": set()}
    for L in LANGS:
        all_assets[L] = set()
    tick_ms = 50.0
    stats = {"objs": 0, "anims": 0, "seqs": 0}

    def reg_img(href):
        if not href:
            return None
        p = oebps / href
        if not p.exists():
            warn("нет файла картинки: %s" % href)
            return None
        if href not in img_map:
            img_map[href] = "img/" + Path(href).stem + ".webp"
        return img_map[href]

    def reg_snd(href):
        if not href:
            return None
        p = oebps / href
        if not p.exists():
            warn("нет файла звука: %s" % href)
            return None
        if href not in snd_map:
            snd_map[href] = "snd/" + Path(href).name
        return snd_map[href]

    for order, href in enumerate(opf["spine_hrefs"]):
        scene = Path(href).stem                    # Szene_003
        num_id = int(re.search(r"(\d+)$", scene).group(1))
        sc = parse_scene_html(oebps / href, args.no_watermark)
        anims, seqs, rate = parse_anim(oebps / "anim" / (scene + ".xml"))
        tick_ms = rate * 1000.0
        smil = parse_smil(oebps / (scene + ".smil"))
        lg = logic.get(num_id, {"touch": {}, "start": []})

        # объекты
        objs = []
        for o in sc["objs"]:
            if not o["w"] and not o["h"]:
                continue              # служебный объект без размера (держатель фоновой музыки)
            o["s"] = reg_img(o.pop("src"))
            if not o["s"]:
                if o["w"] and o["h"]:
                    o["hit"] = 1      # пустая область нажатия
                else:
                    continue          # служебный объект без размера
            objs.append(o)
            key = o["l"] or "common"
            if o["s"]:
                all_assets[key].add(o["s"])
        stats["objs"] += len(objs)

        bg = reg_img(sc["bg"])
        if bg:
            all_assets["common"].add(bg)

        # тексты + тайминги
        text = {}
        for L in LANGS:
            tx = sc["texts"].get(L)
            if not tx:
                continue
            words = [t for t in tx["tok"] if t != "\n"]
            sm = smil.get(L, {"audio": None, "dur": 0.0, "words": {}})
            timing = dict(sm["words"])
            if len(timing) < len(words):
                lab = parse_labels(epub, scene, L)
                for k, v in lab.items():
                    timing.setdefault(k, v)
            if len(timing) != len(words):
                warn("%s %s: слов %d, таймингов %d" % (scene, L, len(words), len(timing)))
            audio = reg_snd(sm["audio"]) if sm["audio"] else None
            if audio:
                all_assets[L].add(audio)
            text[L] = {
                "color": tx["color"], "fs": tx["fs"], "lh": tx["lh"],
                "tok": tx["tok"], "audio": audio, "dur": sm["dur"],
                "t": [timing.get(i) for i in range(len(words))],
            }

        # звуки сцены
        sounds = {}
        sound_ids = set()
        for lst in lg["touch"].values():
            sound_ids.update(s for _, s, _ in lst if s)
        sound_ids.update(s for _, s, _ in lg["start"] if s)
        for sid in sound_ids:
            h = opf["by_id"].get(sid)
            p = reg_snd(h) if h else None
            if p:
                sounds[sid] = p
                # озвучка языковых вариантов определяется по id (…EN_mp3_id и т.п.)
                m = re.search(r"(EN|RU|DE)_mp3_id$", sid)
                all_assets[m.group(1) if m else "common"].add(p)
            else:
                warn("%s: звук %s не найден в манифесте" % (scene, sid))

        # используем только анимации, на которые есть ссылки + все стартовые
        data = {
            "id": scene, "n": num_id,
            "region": sc["region"], "tb": sc["tb"], "bg": bg,
            "objs": objs, "text": text,
            "touch": lg["touch"], "start": lg["start"],
            "sounds": sounds, "anims": anims, "seqs": seqs,
        }
        stats["anims"] += len(anims)
        stats["seqs"] += len(seqs)
        fn = "data/scene_%03d.json" % num_id
        (out / fn).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        scenes_meta.append({"id": scene, "n": num_id, "data": fn, "bg": bg})
        print("  %s: объектов %d, анимаций %d (уникальных %d), слов RU %d" % (
            scene, len(objs), len(anims), len(seqs), len(text.get("RU", {}).get("t", []))))

    # обложка, подсказка, миниатюры
    cover_href = opf["cover"] if opf["cover"] else None
    cover_out = reg_img(cover_href) if cover_href else None
    hint_href = hint.get("image")
    hint_out = None
    if hint_href and (oebps / hint_href).exists():
        img_map[hint_href] = "ui/hint.webp"
        hint_out = "ui/hint.webp"
    thumbs_jobs = []
    for sm in scenes_meta:
        th = {}
        for suffix in ("", "EN", "RU", "DE"):
            f = oebps / "screenshots" / ("chapter%04d%s.png" % (sm["n"], suffix))
            if f.exists():
                dst = "thumbs/chapter%04d%s.webp" % (sm["n"], suffix)
                thumbs_jobs.append((f, out / dst, 320))
                th[suffix] = dst
        sm["thumbs"] = th

    # конвертация картинок
    print("Картинки -> WebP: %d файлов ..." % len(img_map))
    jobs = [(oebps / h, out / dst, args.quality, args.max_side) for h, dst in img_map.items()]
    saved_in = saved_out = 0
    with cf.ProcessPoolExecutor(max_workers=args.workers) as ex:
        for src, dst, ok, err in ex.map(webp_job, jobs, chunksize=8):
            if not ok:
                warn("картинка %s: %s" % (Path(src).name, err))
                continue
            saved_in += os.path.getsize(src)
            saved_out += os.path.getsize(dst)
        for src, dst, ok, err in ex.map(thumb_job, thumbs_jobs, chunksize=8):
            if not ok:
                warn("миниатюра %s: %s" % (Path(src).name, err))
    print("  %.1f МБ -> %.1f МБ" % (saved_in / 1e6, saved_out / 1e6))

    # звук
    print("Звук: %d файлов (%s) ..." % (len(snd_map), "как есть" if not args.audio_kbps else "%d kbps" % args.audio_kbps))
    jobs = [(oebps / h, out / dst, args.audio_kbps) for h, dst in snd_map.items()]
    a_in = a_out = 0
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for src, dst, ok, err in ex.map(audio_job, jobs):
            if not ok:
                warn("звук %s: %s" % (Path(src).name, err))
            a_in += os.path.getsize(src)
            a_out += os.path.getsize(dst)
    print("  %.1f МБ -> %.1f МБ" % (a_in / 1e6, a_out / 1e6))

    # иконки и цвета
    cover_src = (oebps / cover_href) if cover_href and (oebps / cover_href).exists() else None
    edge = make_icons(cover_src, out) if cover_src else "#161a28"

    # статические файлы движка
    for name in ("index.html", "app.js", "style.css"):
        shutil.copyfile(HERE / "src" / name, out / name)
    version = time.strftime("%Y%m%d%H%M%S")
    manifest = {
        "name": opf["title"], "short_name": opf["title"][:12],
        "start_url": "./", "scope": "./", "display": "standalone",
        "orientation": "any", "background_color": "#0e1018", "theme_color": "#0e1018",
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (out / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

    book = {
        "v": version, "title": opf["title"], "author": opf["author"],
        "langs": list(LANGS), "defaultLang": args.default_lang,
        "tickMs": tick_ms, "hint": hint, "hintImg": hint_out,
        "cover": cover_out, "edge": edge, "scenes": scenes_meta,
    }
    (out / "data" / "book.json").write_text(json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    assets = {k: sorted(v) for k, v in all_assets.items()}
    (out / "data" / "assets.json").write_text(json.dumps(assets, separators=(",", ":")), encoding="utf-8")

    core = ["./", "index.html", "app.js", "style.css", "manifest.webmanifest", "data/book.json", "data/assets.json",
            "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"]
    core += [s["data"] for s in scenes_meta]
    if cover_out:
        core.append(cover_out)
    if hint_out:
        core.append(hint_out)
    sw = (HERE / "src" / "sw.js").read_text(encoding="utf-8")
    sw = sw.replace("__VERSION__", version).replace("__CORE__", json.dumps(core))
    (out / "sw.js").write_text(sw, encoding="utf-8")

    total = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    print("\nГотово: %s  (%.1f МБ, %.0f с)" % (out, total / 1e6, time.time() - t0))
    print("Сцен: %d, объектов: %d, анимаций: %d, уникальных последовательностей кадров: %d" % (
        len(scenes_meta), stats["objs"], stats["anims"], stats["seqs"]))
    if warnings:
        print("\nПредупреждения (%d):" % len(warnings))
        for w in warnings[:40]:
            print("  - " + w)
    print("\nПроверка локально:  cd %s && python3 -m http.server 8080   ->  http://localhost:8080" % out)


if __name__ == "__main__":
    main()
