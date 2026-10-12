import resvg_py
from PIL import Image
import io
import re
import os

svg_path = 'AbbaKano app icon and favicon_Logo.svg'
with open(svg_path, 'r', encoding='utf-8') as f:
    svg_str = f.read()

# 1. Full brand icon with background (1024x1024)
full_png_bytes = resvg_py.svg_to_bytes(svg_str)
full_img = Image.open(io.BytesIO(full_png_bytes)).convert("RGBA")
icon_1024 = full_img.resize((1024, 1024), Image.Resampling.LANCZOS)

# 2. Transparent logo without the background square
svg_no_bg = re.sub(r'<path d="M0,0C330,0[^>]*fill="#01197D"/>', '', svg_str, count=1)
no_bg_bytes = resvg_py.svg_to_bytes(svg_no_bg)
logo_transparent = Image.open(io.BytesIO(no_bg_bytes)).convert("RGBA")
bbox = logo_transparent.getbbox()
print("Logo content bounding box:", bbox)
cropped_logo = logo_transparent.crop(bbox)

# 3. Create Android adaptive foreground (1024x1024 with transparent padding for safe zone)
# Android adaptive icon safe zone is the inner 66% circle (radius ~338px from center, diameter ~660px)
# Using target_size = 500 guarantees both "DATA SUB" and "ABBAKANO" sit well within squircle & circular masks.
android_fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
w, h = cropped_logo.size
target_size = 500
if w > h:
    new_w = target_size
    new_h = int(h * (target_size / w))
else:
    new_h = target_size
    new_w = int(w * (target_size / h))
resized_logo = cropped_logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
paste_x = (1024 - new_w) // 2
paste_y = (1024 - new_h) // 2
android_fg.paste(resized_logo, (paste_x, paste_y), resized_logo)

# 4. Android adaptive background (1024x1024 with brand #01197D)
android_bg = Image.new("RGBA", (1024, 1024), (1, 25, 125, 255)) # #01197D

# 5. Splash icon (1024x1024 transparent centered crisp logo)
splash_img = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
target_splash = 820
if w > h:
    sw = target_splash
    sh = int(h * (target_splash / w))
else:
    sh = target_splash
    sw = int(w * (target_splash / h))
resized_splash = cropped_logo.resize((sw, sh), Image.Resampling.LANCZOS)
splash_x = (1024 - sw) // 2
splash_y = (1024 - sh) // 2
splash_img.paste(resized_splash, (splash_x, splash_y), resized_splash)

# 6. Favicon (512x512)
favicon_512 = full_img.resize((512, 512), Image.Resampling.LANCZOS)

targets = [
    ('assets/images/icon.png', icon_1024),
    ('assets/images/android-icon-foreground.png', android_fg),
    ('assets/images/android-icon-background.png', android_bg),
    ('assets/images/splash-icon.png', splash_img),
    ('assets/images/favicon.png', favicon_512),
]

alt_app_dir = r'C:\Users\LENOVO\abbakano-data-sub\AbbaKano\app'

for rel_path, img_obj in targets:
    # Save to local workspace
    img_obj.save(rel_path, format="PNG", optimize=True)
    print(f"Saved {rel_path} ({img_obj.size})")
    
    # Save to active running repo
    alt_dest = os.path.join(alt_app_dir, rel_path)
    if os.path.exists(os.path.dirname(alt_dest)):
        img_obj.save(alt_dest, format="PNG", optimize=True)
        print(f"Saved {alt_dest} ({img_obj.size})")

print("All brand assets generated successfully!")
