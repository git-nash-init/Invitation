# Builds public/brand/*.svg and src/components/site/logo-paths.ts from the open-licence fonts
# Tiro Devanagari Hindi and Cormorant Garamond (SIL OFL). Needs: pip install fonttools uharfbuzz
# and the two .ttf files next to this script (github.com/google/fonts, ofl folder).
import json, re
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib.instancer import instantiateVariableFont

def run(fontfile, text, var=None, track=0):
    blob = hb.Blob.from_file_path(fontfile); face = hb.Face(blob); font = hb.Font(face)
    if var: font.set_variations(var)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties(); hb.shape(font, buf)
    tt = TTFont(fontfile)
    if var: tt = instantiateVariableFont(tt, var)
    gs = tt.getGlyphSet(); order = tt.getGlyphOrder()
    x = 0; parts = []; bp = BoundsPen(gs); bounds=[1e9,1e9,-1e9,-1e9]
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(gs, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip("."))
        tp = TransformPen(pen, (1,0,0,-1, x+pos.x_offset, -pos.y_offset))
        gs[name].draw(tp); parts.append(pen.getCommands())
        b = BoundsPen(gs); gs[name].draw(TransformPen(b,(1,0,0,-1,x+pos.x_offset,-pos.y_offset)))
        if b.bounds:
            bounds=[min(bounds[0],b.bounds[0]),min(bounds[1],b.bounds[1]),max(bounds[2],b.bounds[2]),max(bounds[3],b.bounds[3])]
        x += pos.x_advance + track
    return " ".join(parts), bounds

pra_d, pra_b = run("tiro.ttf", "प्र")
word_d, word_b = run("cg.ttf", "Pratham", {"wght":600})
inv_d, inv_b = run("cg.ttf", "INVITATION", {"wght":600}, track=260)
dev_d, dev_b = run("tiro.ttf", "प्रथम")
print("pra", pra_b, "word", word_b, "inv", inv_b)

GRAD = '''<linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#FFE59A"/><stop offset=".5" stop-color="#F5A300"/><stop offset="1" stop-color="#B8741A"/></linearGradient>
<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A1740"/><stop offset="1" stop-color="#4A0A1E"/></linearGradient>'''

OUTER = "M8 116V54C8 38 22 30 32 22C40 16 46 12 50 4C54 12 60 16 68 22C78 30 92 38 92 54V116Z"
# glyph placement: fit प्र into a box centred at (50, 80), height 44
gw = pra_b[2]-pra_b[0]; gh = pra_b[3]-pra_b[1]
S = 46/gh
tx = 50 - (pra_b[0]+gw/2)*S; ty = 77 - (pra_b[1]+gh/2)*S
lotus = '<g fill="url(#g)"><path d="M50 110C47 105 47 102 50 99C53 102 53 105 50 110Z"/><path transform="rotate(-40 50 110)" d="M50 110C47 105 47 102 50 99C53 102 53 105 50 110Z"/><path transform="rotate(40 50 110)" d="M50 110C47 105 47 102 50 99C53 102 53 105 50 110Z"/></g>'

def mark(defs=True, bg=None):
    return f'''{GRAD if defs else ''}
<path d="{OUTER}" fill="url(#g)"/>
<path d="{OUTER}" fill="url(#m)" transform="translate(50 116) scale(.83 .9) translate(-50 -116)"/>
<path d="{OUTER}" fill="none" stroke="#FFE59A" stroke-opacity=".55" stroke-width=".8" transform="translate(50 116) scale(.9 .94) translate(-50 -116)"/>
<path d="{pra_d}" fill="url(#g)" transform="translate({tx:.2f} {ty:.2f}) scale({S:.4f})"/>
{lotus}
<circle cx="50" cy="2.4" r="2.4" fill="url(#g)"/>'''

open("mark.svg","w",encoding="utf-8").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="100" height="120">{mark()}</svg>')

# horizontal lockup: mark + wordmark paths
ws = 44/ (word_b[3]-word_b[1]) * 0.78
wordw = (word_b[2]-word_b[0])*ws
iscale = 11.5/ (inv_b[3]-inv_b[1]); invw=(inv_b[2]-inv_b[0])*iscale
LW = 118 + max(wordw, invw) + 6
lock = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LW:.0f} 120" width="{LW:.0f}" height="120">
{GRAD}
<g transform="translate(0 0)">{mark(False)}</g>
<path d="{word_d}" fill="#4A0A1E" transform="translate(118 {76:.1f}) scale({ws:.4f})"/>
<path d="{inv_d}" fill="url(#g)" transform="translate(120 98) scale({iscale:.4f})"/>
</svg>'''
open("logo.svg","w",encoding="utf-8").write(lock)

import pathlib
ts = f'''// Generated from Tiro Devanagari Hindi (OFL) by scripts/build-logo; do not edit by hand.
export const LOGO = {{
  outer: {json.dumps(OUTER)},
  pra: {json.dumps(pra_d)},
  praTransform: "translate({tx:.2f} {ty:.2f}) scale({S:.4f})",
  devanagari: {json.dumps(dev_d)},
  devBounds: {json.dumps(dev_b)},
}} as const;
'''
open("logo-paths.ts","w",encoding="utf-8").write(ts)
print("lockup width", LW, "word scale", ws)
