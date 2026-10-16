#!/usr/bin/env python3
import json
import os
import numpy as np
from PIL import Image
from collections import deque
from psd_tools import PSDImage

def main():
    print("=== STARTING FULL AUTHOR ASSET EXPORT ===")
    
    base_dir = "/Users/aego/Desktop/Projectrs/Mousekin_Claude"
    psd_dir = "/Users/aego/Downloads/PSD_images"
    
    os.makedirs(f"{base_dir}/time_transport_game/assets/backgrounds", exist_ok=True)
    os.makedirs(f"{base_dir}/time_transport_game/assets/characters", exist_ok=True)
    os.makedirs(f"{base_dir}/time_transport_game/assets/clocks", exist_ok=True)
    os.makedirs(f"{base_dir}/time_transport_game/assets/parts", exist_ok=True)
    os.makedirs(f"{base_dir}/app/img/clocks", exist_ok=True)

    # 1. PANORAMA
    print("\n--- 1. Exporting Panorama ---")
    pano = Image.open(f"{psd_dir}/2333.jpg")
    print(f"Panorama size: {pano.size}")
    pano.save(f"{base_dir}/time_transport_game/assets/backgrounds/clocktown_pano.png")
    pano.save(f"{base_dir}/time_transport_game/assets/backgrounds/clocktown_pano.webp", format="WEBP", quality=85)
    pano.save(f"{base_dir}/app/img/clocktown_pano.png")
    pano.save(f"{base_dir}/app/img/clocktown_pano.webp", format="WEBP", quality=85)
    print("Panorama saved to backgrounds and app/img.")

    # Helper: flood fill white background
    def flood_fill_clean(im, tolerance=25):
        arr = np.array(im.convert("RGBA"))
        h, w, _ = arr.shape
        visited = np.zeros((h, w), dtype=bool)
        
        def is_bg(y, x):
            if arr[y, x, 3] == 0:
                return True
            r, g, b = int(arr[y, x, 0]), int(arr[y, x, 1]), int(arr[y, x, 2])
            return r >= (255 - tolerance) and g >= (255 - tolerance) and b >= (255 - tolerance)
            
        queue = deque()
        for x in range(w):
            if is_bg(0, x):
                queue.append((0, x))
                visited[0, x] = True
            if is_bg(h-1, x):
                queue.append((h-1, x))
                visited[h-1, x] = True
        for y in range(h):
            if not visited[y, 0] and is_bg(y, 0):
                queue.append((y, 0))
                visited[y, 0] = True
            if not visited[y, w-1] and is_bg(y, w-1):
                queue.append((y, w-1))
                visited[y, w-1] = True
                
        while queue:
            y, x = queue.popleft()
            for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    if is_bg(ny, nx):
                        visited[ny, nx] = True
                        queue.append((ny, nx))
                        
        arr[visited, 3] = 0
        arr[arr[:,:,3] == 0] = 0
        res = Image.fromarray(arr)
        bbox = res.getbbox()
        if bbox:
            res = res.crop(bbox)
        return res

    # 2. CHARACTERS & CLOCKS
    print("\n--- 2. Exporting Characters and Clocks ---")
    
    # Scooter Mouse & Clock
    psd_sc = PSDImage.open(f"{psd_dir}/самокат.psd")
    sc_m_body = [l for l in psd_sc if l.name == "Слой 14"][0].composite()
    sc_m_hat = [l for l in psd_sc if l.name == "шляпа"][0].composite()
    c_sc_m = Image.new("RGBA", (1342, 2371), (0,0,0,0))
    c_sc_m.paste(sc_m_body, (0, 0))
    c_sc_m.paste(sc_m_hat, (397, 36), sc_m_hat)
    clean_sc_mouse = flood_fill_clean(c_sc_m, tolerance=25)
    clean_sc_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_scooter_strawhat_clean.png")
    clean_sc_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_scooter_strawhat_clean.webp", format="WEBP", quality=92)
    print(f"Scooter mouse saved: {clean_sc_mouse.size}")

    clock_sc = [l for l in psd_sc if l.name == "Группа 1"][0].composite()
    bbox = clock_sc.getbbox()
    if bbox: clock_sc = clock_sc.crop(bbox)
    clock_sc.save(f"{base_dir}/time_transport_game/assets/clocks/clock_scooter.png")
    clock_sc.save(f"{base_dir}/time_transport_game/assets/clocks/clock_scooter.webp", format="WEBP", quality=90)
    clock_sc.save(f"{base_dir}/app/img/clocks/clock_scooter.png")
    clock_sc.save(f"{base_dir}/app/img/clocks/clock_scooter.webp", format="WEBP", quality=90)
    print(f"Scooter clock saved: {clock_sc.size}")

    # Bike Mouse & Clock
    psd_bk = PSDImage.open(f"{psd_dir}/3 времясипед2.psd")
    bk_m_layer = [l for l in psd_bk if l.name == "Группа 2"][0]
    clean_bk_mouse = flood_fill_clean(bk_m_layer.composite(), tolerance=25)
    clean_bk_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_cyclist_clean.png")
    clean_bk_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_cyclist_clean.webp", format="WEBP", quality=92)
    clean_bk_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_cyclist.png")
    clean_bk_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_cyclist.webp", format="WEBP", quality=92)
    print(f"Bike mouse saved: {clean_bk_mouse.size}")

    clock_layers_bk = ['корпус', 'внутренность', 'бордюр', 'разделитель', 'цепь', 'маятник', 'циферблат', 'верхушка']
    c_bk_clock = Image.new("RGBA", (8658, 3319), (0,0,0,0))
    for name in clock_layers_bk:
        l = [x for x in psd_bk if x.name == name]
        if l:
            comp = l[0].composite()
            if comp: c_bk_clock.paste(comp, (l[0].bbox[0], l[0].bbox[1]), comp)
    bbox = c_bk_clock.getbbox()
    if bbox: clock_bk = c_bk_clock.crop(bbox)
    clock_bk.save(f"{base_dir}/time_transport_game/assets/clocks/clock_bike.png")
    clock_bk.save(f"{base_dir}/time_transport_game/assets/clocks/clock_bike.webp", format="WEBP", quality=90)
    clock_bk.save(f"{base_dir}/app/img/clocks/clock_bike.png")
    clock_bk.save(f"{base_dir}/app/img/clocks/clock_bike.webp", format="WEBP", quality=90)
    print(f"Bike clock saved: {clock_bk.size}")

    # Moped Mouse & Clock
    psd_mp = PSDImage.open(f"{psd_dir}/2 времяпед.psd")
    mp_m = [l for l in psd_mp if l.name == "Слой 11"][0].composite()
    mp_h = [l for l in psd_mp if l.name == "шлем"][0].composite()
    c_mp_m = Image.new("RGBA", (434, 784), (0,0,0,0))
    c_mp_m.paste(mp_m, (0, 0))
    c_mp_m.paste(mp_h, (145-25, 43-18), mp_h)
    clean_mp_mouse = flood_fill_clean(c_mp_m, tolerance=25)
    clean_mp_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_moped_driver_clean.png")
    clean_mp_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_moped_driver_clean.webp", format="WEBP", quality=92)
    clean_mp_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_moped_driver.png")
    clean_mp_mouse.save(f"{base_dir}/time_transport_game/assets/characters/mouse_moped_driver.webp", format="WEBP", quality=92)
    print(f"Moped mouse saved: {clean_mp_mouse.size}")

    clock_mp = [l for l in psd_mp if l.name == "часы"][0].composite()
    bbox = clock_mp.getbbox()
    if bbox: clock_mp = clock_mp.crop(bbox)
    clock_mp.save(f"{base_dir}/time_transport_game/assets/clocks/clock_moped.png")
    clock_mp.save(f"{base_dir}/time_transport_game/assets/clocks/clock_moped.webp", format="WEBP", quality=90)
    clock_mp.save(f"{base_dir}/app/img/clocks/clock_moped.png")
    clock_mp.save(f"{base_dir}/app/img/clocks/clock_moped.webp", format="WEBP", quality=90)
    print(f"Moped clock saved: {clock_mp.size}")

    # Helper for ghost blueprint
    def create_ghost(full_im):
        arr = np.array(full_im.convert("RGBA"))
        alpha = arr[:, :, 3]
        ghost_arr = np.zeros_like(arr)
        mask = alpha > 5
        ghost_arr[mask, 0] = 180
        ghost_arr[mask, 1] = 215
        ghost_arr[mask, 2] = 255
        ghost_arr[mask, 3] = np.clip((alpha[mask].astype(float) * 0.28), 0, 75).astype(np.uint8)
        return Image.fromarray(ghost_arr)

    # Helper for safe mask extraction
    def safe_paste_mask(target_mask, sub_layer, gx, gy, w, h):
        comp = sub_layer.composite()
        if not comp: return
        c_arr = np.array(comp)
        sx, sy = sub_layer.bbox[0] - gx, sub_layer.bbox[1] - gy
        sw, sh = comp.size
        x1, y1 = max(0, sx), max(0, sy)
        x2, y2 = min(w, sx + sw), min(h, sy + sh)
        if x2 > x1 and y2 > y1:
            target_mask[y1:y2, x1:x2] |= (c_arr[y1-sy:y2-sy, x1-sx:x2-sx, 3] > 10)

    # Load transport_data.json
    with open(f"{base_dir}/time_transport_game/assets/transport_data.json") as f:
        tdata = json.load(f)

    # 3. VEHICLES & ZERO-DIFF RECONSTRUCTION VERIFICATION
    # --- A. SCOOTER ---
    print("\n--- 3A. Processing Scooter ---")
    sc_grp = [l for l in psd_sc if l.name == "самокат"][0]
    gx_s, gy_s, _, _ = sc_grp.bbox
    sc_full = sc_grp.composite()
    sc_arr = np.array(sc_full)
    h_sc, w_sc, _ = sc_arr.shape
    sc_arr[sc_arr[:,:,3] < 5] = 0
    sc_full = Image.fromarray(sc_arr)

    sc_full.save(f"{base_dir}/time_transport_game/assets/самокат_full.png")
    sc_full.save(f"{base_dir}/time_transport_game/assets/самокат_full.webp", format="WEBP", quality=95)
    sc_ghost = create_ghost(sc_full)
    sc_ghost.save(f"{base_dir}/time_transport_game/assets/самокат_ghost.png")
    sc_ghost.save(f"{base_dir}/time_transport_game/assets/самокат_ghost.webp", format="WEBP", quality=95)

    bw_mask_s = np.zeros((h_sc, w_sc), dtype=bool)
    safe_paste_mask(bw_mask_s, [x for x in sc_grp if x.name == "колесо2"][0], gx_s, gy_s, w_sc, h_sc)
    fw_mask_s = np.zeros((h_sc, w_sc), dtype=bool)
    safe_paste_mask(fw_mask_s, [x for x in sc_grp if x.name == "колесо1"][0], gx_s, gy_s, w_sc, h_sc)

    active_s = (sc_arr[:,:,3] > 0)
    m_bw_s = bw_mask_s & active_s
    m_fw_s = fw_mask_s & active_s & ~m_bw_s
    m_rest_s = active_s & ~m_bw_s & ~m_fw_s
    xs_s = np.tile(np.arange(w_sc), (h_sc, 1))
    m_pl_s = m_rest_s & (xs_s < 1940)
    m_hb_s = m_rest_s & (xs_s >= 1940)

    sc_parts_def = [
        ('platform', 'Платформа самоката', 'Основа из живой ветки, на которой стоит Мышонок', 'parts/scooter_platform.png', 'parts/scooter_platform.webp', m_pl_s),
        ('handlebar', 'Рулевая стойка со стрелками', 'Ветка с цветами, часиками и рулём', 'parts/scooter_handlebar.png', 'parts/scooter_handlebar.webp', m_hb_s),
        ('front_wheel', 'Переднее соломенное колесо', 'Крутится вперёд и отмеряет секунды', 'parts/scooter_front_wheel.png', 'parts/scooter_front_wheel.webp', m_fw_s),
        ('back_wheel', 'Заднее соломенное колесо', 'Поддерживает платформу сзади', 'parts/scooter_back_wheel.png', 'parts/scooter_back_wheel.webp', m_bw_s)
    ]

    sc_parts_data = []
    canvas_sc = np.zeros_like(sc_arr)

    for pid, pname, phint, pfile, pwebp, mask in sc_parts_def:
        part_arr = np.zeros_like(sc_arr)
        part_arr[mask] = sc_arr[mask]
        part_im = Image.fromarray(part_arr)
        bbox = part_im.getbbox()
        cropped = part_im.crop(bbox)
        cropped.save(f"{base_dir}/time_transport_game/assets/{pfile}")
        cropped.save(f"{base_dir}/time_transport_game/assets/{pwebp}", format="WEBP", quality=95)
        
        tx, ty, tw, th = bbox[0], bbox[1], cropped.size[0], cropped.size[1]
        lp = round(tx / w_sc * 100, 3)
        tp = round(ty / h_sc * 100, 3)
        wp = round(tw / w_sc * 100, 3)
        hp = round(th / h_sc * 100, 3)
        
        sc_parts_data.append({
            'id': pid,
            'name': pname,
            'hint': phint,
            'file': pfile,
            'fileWebp': pwebp,
            'targetX': tx,
            'targetY': ty,
            'width': tw,
            'height': th,
            'leftPct': lp,
            'topPct': tp,
            'widthPct': wp,
            'heightPct': hp
        })
        canvas_sc[ty:ty+th, tx:tx+tw] += np.array(cropped)

    diff_sc = np.max(np.abs(canvas_sc.astype(int) - sc_arr.astype(int)))
    print(f"Scooter reconstruction max diff across all pixels: {diff_sc}")
    assert diff_sc == 0, f"Scooter diff is {diff_sc}"

    tdata['scooter']['width'] = w_sc
    tdata['scooter']['height'] = h_sc
    tdata['scooter']['parts'] = sc_parts_data

    # --- B. BIKE ---
    print("\n--- 3B. Processing Bike ---")
    bk_grp = [l for l in psd_bk if l.name == "Группа 1"][0]
    gx_b, gy_b, _, _ = bk_grp.bbox
    bk_full = bk_grp.composite()
    bk_arr = np.array(bk_full)
    h_bk, w_bk, _ = bk_arr.shape
    bk_arr[bk_arr[:,:,3] < 5] = 0
    bk_full = Image.fromarray(bk_arr)

    bk_full.save(f"{base_dir}/time_transport_game/assets/вел_full.png")
    bk_full.save(f"{base_dir}/time_transport_game/assets/вел_full.webp", format="WEBP", quality=95)
    bk_ghost = create_ghost(bk_full)
    bk_ghost.save(f"{base_dir}/time_transport_game/assets/вел_ghost.png")
    bk_ghost.save(f"{base_dir}/time_transport_game/assets/вел_ghost.webp", format="WEBP", quality=95)

    bw_b_mask = np.zeros((h_bk, w_bk), dtype=bool)
    for name in ['заднее колесо', 'Слой 6', 'цифры']:
        safe_paste_mask(bw_b_mask, [x for x in bk_grp if x.name == name][0], gx_b, gy_b, w_bk, h_bk)

    fw_b_mask = np.zeros((h_bk, w_bk), dtype=bool)
    for name in ['переднее колесо', 'Слой 5']:
        safe_paste_mask(fw_b_mask, [x for x in bk_grp if x.name == name][0], gx_b, gy_b, w_bk, h_bk)

    pedal_b_mask = np.zeros((h_bk, w_bk), dtype=bool)
    for name in ['педаль1', 'педаль1 копия']:
        safe_paste_mask(pedal_b_mask, [x for x in bk_grp if x.name == name][0], gx_b, gy_b, w_bk, h_bk)

    spokes_b = [x for x in bk_grp if x.name == "спицы"][0]
    sp_comp_b = spokes_b.composite()
    if sp_comp_b:
        sp_arr = np.array(sp_comp_b)
        sx, sy = spokes_b.bbox[0] - gx_b, spokes_b.bbox[1] - gy_b
        sw, sh = sp_comp_b.size
        for y_s in range(sh):
            for x_s in range(sw):
                if sp_arr[y_s, x_s, 3] > 10:
                    glob_x = sx + x_s
                    glob_y = sy + y_s
                    if 0 <= glob_y < h_bk and 0 <= glob_x < w_bk:
                        if glob_x < 1669:
                            bw_b_mask[glob_y, glob_x] = True
                        else:
                            fw_b_mask[glob_y, glob_x] = True

    active_b = (bk_arr[:,:,3] > 0)
    m_bw_b = bw_b_mask & active_b
    m_fw_b = fw_b_mask & active_b & ~m_bw_b
    m_pedal_b = pedal_b_mask & active_b & ~m_bw_b & ~m_fw_b

    rest_b = active_b & ~m_bw_b & ~m_fw_b & ~m_pedal_b
    xs_b = np.tile(np.arange(w_bk), (h_bk, 1))
    ys_b = np.tile(np.arange(h_bk)[:, None], (1, w_bk))

    m_hb_b = rest_b & (ys_b <= 450) & (xs_b >= 1800)
    m_saddle_b = rest_b & ~m_hb_b & (xs_b >= 1200) & (xs_b <= 1800) & (ys_b <= 720)
    m_frame_b = rest_b & ~m_hb_b & ~m_saddle_b

    bk_parts_def = [
        ('front_wheel', 'Переднее колесо со спицами-стрелками', 'Колесо со стрелочками указывает дорогу', 'parts/bike_front_wheel.png', 'parts/bike_front_wheel.webp', m_fw_b),
        ('back_wheel', 'Большое колесо с цифрами 3, 6, 9', 'Колесо с золотыми часовыми цифрами', 'parts/bike_back_wheel.png', 'parts/bike_back_wheel.webp', m_bw_b),
        ('frame', 'Сливочно-бежевая рама', 'Изящная изогнутая рама Времясипеда', 'parts/bike_frame.png', 'parts/bike_frame.webp', m_frame_b),
        ('handlebars', 'Руль с золотистой фарой', 'Руль со звонком и фарой для ночных поездок', 'parts/bike_handlebars.png', 'parts/bike_handlebars.webp', m_hb_b),
        ('saddle', 'Кожаное седло', 'Мягкое седло для Мышонка-путешественника', 'parts/bike_saddle.png', 'parts/bike_saddle.webp', m_saddle_b),
        ('pedals', 'Шестерёнка с педалями', 'Зелёная шестерня и педали привода', 'parts/bike_pedals.png', 'parts/bike_pedals.webp', m_pedal_b)
    ]

    bk_parts_data = []
    canvas_bk = np.zeros_like(bk_arr)

    for pid, pname, phint, pfile, pwebp, mask in bk_parts_def:
        part_arr = np.zeros_like(bk_arr)
        part_arr[mask] = bk_arr[mask]
        part_im = Image.fromarray(part_arr)
        bbox = part_im.getbbox()
        cropped = part_im.crop(bbox)
        cropped.save(f"{base_dir}/time_transport_game/assets/{pfile}")
        cropped.save(f"{base_dir}/time_transport_game/assets/{pwebp}", format="WEBP", quality=95)
        
        tx, ty, tw, th = bbox[0], bbox[1], cropped.size[0], cropped.size[1]
        lp = round(tx / w_bk * 100, 3)
        tp = round(ty / h_bk * 100, 3)
        wp = round(tw / w_bk * 100, 3)
        hp = round(th / h_bk * 100, 3)
        
        bk_parts_data.append({
            'id': pid,
            'name': pname,
            'hint': phint,
            'file': pfile,
            'fileWebp': pwebp,
            'targetX': tx,
            'targetY': ty,
            'width': tw,
            'height': th,
            'leftPct': lp,
            'topPct': tp,
            'widthPct': wp,
            'heightPct': hp
        })
        canvas_bk[ty:ty+th, tx:tx+tw] += np.array(cropped)

    diff_bk = np.max(np.abs(canvas_bk.astype(int) - bk_arr.astype(int)))
    print(f"Bike reconstruction max diff across all pixels: {diff_bk}")
    assert diff_bk == 0, f"Bike diff is {diff_bk}"

    tdata['bike']['width'] = w_bk
    tdata['bike']['height'] = h_bk
    tdata['bike']['parts'] = bk_parts_data

    # --- C. MOPED ---
    print("\n--- 3C. Processing Moped ---")
    mp_grp = [l for l in psd_mp if l.name == "мотоцикл"][0]
    gx_m, gy_m, _, _ = mp_grp.bbox
    mp_full = mp_grp.composite()
    mp_arr = np.array(mp_full)
    h_mp, w_mp, _ = mp_arr.shape
    mp_arr[mp_arr[:,:,3] < 5] = 0
    mp_full = Image.fromarray(mp_arr)

    mp_full.save(f"{base_dir}/time_transport_game/assets/мопед_full.png")
    mp_full.save(f"{base_dir}/time_transport_game/assets/мопед_full.webp", format="WEBP", quality=95)
    mp_ghost = create_ghost(mp_full)
    mp_ghost.save(f"{base_dir}/time_transport_game/assets/мопед_ghost.png")
    mp_ghost.save(f"{base_dir}/time_transport_game/assets/мопед_ghost.webp", format="WEBP", quality=95)

    wheels_grp_m = [x for x in mp_grp if x.name == "колеса"][0]
    w_front_m = [x for x in wheels_grp_m if x.name == "Слой 9"][0]
    w_back_m = [x for x in wheels_grp_m if x.name == "Слой 9 копия"][0]
    seat_m = [x for x in mp_grp if x.name == "задник и седло"][0]
    exhaust_m = [x for x in mp_grp if x.name == "трубки"][0]
    headlight_m = [x for x in mp_grp if x.name == "фонарь и дудки"][0]

    fw_m_mask = np.zeros((h_mp, w_mp), dtype=bool)
    safe_paste_mask(fw_m_mask, w_front_m, gx_m, gy_m, w_mp, h_mp)
    bw_m_mask = np.zeros((h_mp, w_mp), dtype=bool)
    safe_paste_mask(bw_m_mask, w_back_m, gx_m, gy_m, w_mp, h_mp)
    seat_m_mask = np.zeros((h_mp, w_mp), dtype=bool)
    safe_paste_mask(seat_m_mask, seat_m, gx_m, gy_m, w_mp, h_mp)
    exh_m_mask = np.zeros((h_mp, w_mp), dtype=bool)
    safe_paste_mask(exh_m_mask, exhaust_m, gx_m, gy_m, w_mp, h_mp)
    hl_m_mask = np.zeros((h_mp, w_mp), dtype=bool)
    safe_paste_mask(hl_m_mask, headlight_m, gx_m, gy_m, w_mp, h_mp)

    active_m = (mp_arr[:,:,3] > 0)
    m_fw_m = fw_m_mask & active_m
    m_bw_m = bw_m_mask & active_m & ~m_fw_m
    m_seat_m = seat_m_mask & active_m & ~m_fw_m & ~m_bw_m
    m_exh_m = exh_m_mask & active_m & ~m_fw_m & ~m_bw_m & ~m_seat_m
    m_hl_m = hl_m_mask & active_m & ~m_fw_m & ~m_bw_m & ~m_seat_m & ~m_exh_m
    m_frame_m = active_m & ~m_fw_m & ~m_bw_m & ~m_seat_m & ~m_exh_m & ~m_hl_m

    mp_parts_def = [
        ('front_wheel', 'Переднее зубчатое колесо', 'Зубчатое колесо-шестерня быстрого хода', 'parts/moped_front_wheel.png', 'parts/moped_front_wheel.webp', m_fw_m),
        ('back_wheel', 'Заднее зубчатое колесо', 'Колесо-шестерня, соединённое с механизмом', 'parts/moped_back_wheel.png', 'parts/moped_back_wheel.webp', m_bw_m),
        ('frame', 'Деревянно-медная рама с цифрами 9 и 12', 'Массивная рама стимпанк-чоппера', 'parts/moped_frame.png', 'parts/moped_frame.webp', m_frame_m),
        ('engine', 'Медные выхлопные трубы', 'Трубы, выпускающие облачка мышиного пара', 'parts/moped_engine.png', 'parts/moped_engine.webp', m_exh_m),
        ('seat', 'Седло на пружине и заднее крыло', 'Удобное пружинное сиденье водителя', 'parts/moped_seat.png', 'parts/moped_seat.webp', m_seat_m),
        ('headlight', 'Фара и мышиные дудки', 'Фара освещает путь, а дудки звонко гудят', 'parts/moped_headlight.png', 'parts/moped_headlight.webp', m_hl_m)
    ]

    mp_parts_data = []
    canvas_mp = np.zeros_like(mp_arr)

    for pid, pname, phint, pfile, pwebp, mask in mp_parts_def:
        part_arr = np.zeros_like(mp_arr)
        part_arr[mask] = mp_arr[mask]
        part_im = Image.fromarray(part_arr)
        bbox = part_im.getbbox()
        cropped = part_im.crop(bbox)
        cropped.save(f"{base_dir}/time_transport_game/assets/{pfile}")
        cropped.save(f"{base_dir}/time_transport_game/assets/{pwebp}", format="WEBP", quality=95)
        
        tx, ty, tw, th = bbox[0], bbox[1], cropped.size[0], cropped.size[1]
        lp = round(tx / w_mp * 100, 3)
        tp = round(ty / h_mp * 100, 3)
        wp = round(tw / w_mp * 100, 3)
        hp = round(th / h_mp * 100, 3)
        
        mp_parts_data.append({
            'id': pid,
            'name': pname,
            'hint': phint,
            'file': pfile,
            'fileWebp': pwebp,
            'targetX': tx,
            'targetY': ty,
            'width': tw,
            'height': th,
            'leftPct': lp,
            'topPct': tp,
            'widthPct': wp,
            'heightPct': hp
        })
        canvas_mp[ty:ty+th, tx:tx+tw] += np.array(cropped)

    diff_mp = np.max(np.abs(canvas_mp.astype(int) - mp_arr.astype(int)))
    print(f"Moped reconstruction max diff across all pixels: {diff_mp}")
    assert diff_mp == 0, f"Moped diff is {diff_mp}"

    tdata['moped']['width'] = w_mp
    tdata['moped']['height'] = h_mp
    tdata['moped']['parts'] = mp_parts_data

    # Save transport_data.json
    with open(f"{base_dir}/time_transport_game/assets/transport_data.json", "w", encoding="utf-8") as f:
        json.dump(tdata, f, ensure_ascii=False, indent=2)

    print("\n=== SUCCESS: All assets exported and 100% verified with ZERO pixel diff! ===")

if __name__ == '__main__':
    main()
