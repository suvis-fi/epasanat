"""One-off generator for public/epasanalista.pdf. Embeds Arial so Finnish letters render."""

import json
import re
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SETS = ROOT / "src" / "content" / "sets.json"
HTML = ROOT / "public" / "epasanalista" / "index.html"
OUT = ROOT / "public" / "epasanalista.pdf"
ARIAL = Path(r"C:\Windows\Fonts\arial.ttf")
ARIAL_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")

PAGE_W = 595.28
PAGE_H = 841.89
LEFT = 46
RIGHT = 46
TOP = 52
BOTTOM = 50
CONTENT_W = PAGE_W - LEFT - RIGHT


def read_tables(data):
    count = struct.unpack_from(">H", data, 4)[0]
    tables = {}
    for i in range(count):
        tag, _checksum, offset, length = struct.unpack_from(">4sIII", data, 12 + i * 16)
        tables[tag.decode("latin1")] = data[offset : offset + length]
    return tables


def parse_format4(cmap, offset):
    _fmt, length, _lang, seg_x2, _search, _entry, _shift = struct.unpack_from(">HHHHHHH", cmap, offset)
    seg_count = seg_x2 // 2
    pos = offset + 14
    end_code = struct.unpack_from(f">{seg_count}H", cmap, pos)
    pos += seg_count * 2 + 2
    start_code = struct.unpack_from(f">{seg_count}H", cmap, pos)
    pos += seg_count * 2
    id_delta = struct.unpack_from(f">{seg_count}h", cmap, pos)
    pos += seg_count * 2
    id_range = struct.unpack_from(f">{seg_count}H", cmap, pos)
    range_pos = pos
    end = offset + length

    def lookup(code):
        lo, hi = 0, seg_count - 1
        found = None
        while lo <= hi:
            mid = (lo + hi) // 2
            if end_code[mid] >= code:
                found = mid
                hi = mid - 1
            else:
                lo = mid + 1
        if found is None or code < start_code[found]:
            return 0
        if id_range[found] == 0:
            return (code + id_delta[found]) & 0xFFFF
        ptr = range_pos + found * 2 + id_range[found] + 2 * (code - start_code[found])
        if ptr + 2 > end:
            return 0
        glyph = struct.unpack_from(">H", cmap, ptr)[0]
        if glyph == 0:
            return 0
        return (glyph + id_delta[found]) & 0xFFFF

    return lookup


def parse_cmap(cmap):
    _version, count = struct.unpack_from(">HH", cmap, 0)
    chosen = None
    for i in range(count):
        platform, encoding, offset = struct.unpack_from(">HHI", cmap, 4 + i * 8)
        fmt = struct.unpack_from(">H", cmap, offset)[0]
        if (platform, encoding, fmt) == (3, 1, 4):
            chosen = offset
            break
    if chosen is None:
        raise SystemExit("Arial cmap has no Windows Unicode format 4 table")
    return parse_format4(cmap, chosen)


def ps_name(name_table, fallback):
    _fmt, count, string_offset = struct.unpack_from(">HHH", name_table, 0)
    for i in range(count):
        platform, encoding, _lang, name_id, length, offset = struct.unpack_from(
            ">HHHHHH", name_table, 6 + i * 12
        )
        if name_id == 6 and platform == 3 and encoding == 1:
            raw = name_table[string_offset + offset : string_offset + offset + length]
            return raw.decode("utf-16-be")
    return fallback


class Font:
    def __init__(self, path, fallback_name):
        self.raw = path.read_bytes()
        tables = read_tables(self.raw)
        head = tables["head"]
        hhea = tables["hhea"]
        hmtx = tables["hmtx"]
        maxp = tables["maxp"]
        self.units = struct.unpack_from(">H", head, 18)[0]
        self.bbox = struct.unpack_from(">hhhh", head, 36)
        self.ascent, self.descent = struct.unpack_from(">hh", hhea, 4)
        metrics = struct.unpack_from(">H", hhea, 34)[0]
        self.advances = [struct.unpack_from(">H", hmtx, i * 4)[0] for i in range(metrics)]
        self.num_glyphs = struct.unpack_from(">H", maxp, 4)[0]
        self.lookup = parse_cmap(tables["cmap"])
        self.ps = ps_name(tables["name"], fallback_name)
        self.cap = self._cap_height(tables.get("OS/2"))
        self.used = {}
        self.widths = {}

    def _cap_height(self, os2):
        if not os2 or len(os2) < 90:
            return 700
        version = struct.unpack_from(">H", os2, 0)[0]
        if version < 2:
            return 700
        return round(struct.unpack_from(">h", os2, 88)[0] * 1000 / self.units)

    def glyph(self, char):
        gid = self.lookup(ord(char))
        if not gid or gid >= self.num_glyphs:
            raise SystemExit(f"{self.ps} has no glyph for {char!r} (U+{ord(char):04X})")
        return gid

    def width(self, text, size):
        total = 0
        for char in text:
            total += self.advances[min(self.glyph(char), len(self.advances) - 1)]
        return total * size / self.units

    def encode(self, text):
        codes = []
        for char in text:
            gid = self.glyph(char)
            self.used[gid] = ord(char)
            advance = self.advances[min(gid, len(self.advances) - 1)]
            self.widths[gid] = round(advance * 1000 / self.units)
            codes.append(f"{gid:04X}")
        return "".join(codes)

    def scaled(self, value):
        return round(value * 1000 / self.units)


def sample(words, count=20):
    if len(words) <= count:
        return words
    return [words[round(i * (len(words) - 1) / (count - 1))] for i in range(count)]


def load_levels():
    data = json.loads(SETS.read_text(encoding="utf-8"))
    levels = []
    for level in data["levels"]:
        picked = sample(level["words"])
        levels.append(
            {
                "name": level["name"],
                "blurb": level["blurb"],
                "words": [{"word": item["word"], "syll": "-".join(item["syllables"])} for item in picked],
            }
        )
    return levels


def html_levels():
    html = HTML.read_text(encoding="utf-8")
    parts = re.split(r"<h2>([^<]+)</h2>", html)
    found = []
    for name, body in zip(parts[1::2], parts[2::2]):
        words = re.findall(r'<span class="word">([^<]+)</span><span class="syll">([^<]+)</span>', body)
        found.append({"name": name, "words": [{"word": word, "syll": syll} for word, syll in words]})
    return found


def pdf_utf16(text):
    raw = b"\xfe\xff" + text.encode("utf-16-be")
    return b"<" + raw.hex().upper().encode("ascii") + b">"


class Writer:
    def __init__(self, regular, bold):
        self.regular = regular
        self.bold = bold
        self.pages = []
        self.ops = bytearray()
        self.y = 0
        self.new_page()

    def new_page(self):
        self.ops = bytearray()
        self.pages.append(self.ops)
        self.y = PAGE_H - TOP
        self.draw(0, 30, 9, "© Suvi Lindfors · epasanat.vercel.app", font=self.regular, color=(0.37, 0.34, 0.30), center=True)

    def need(self, height):
        if self.y - height < BOTTOM:
            self.new_page()

    def draw(self, x, y, size, text, font, color=(0.11, 0.10, 0.08), center=False):
        if center:
            x = (PAGE_W - font.width(text, size)) / 2
        encoded = font.encode(text)
        r, g, b = color
        self.ops += (
            f"{r:.3f} {g:.3f} {b:.3f} rg\nBT /{'F2' if font is self.bold else 'F1'} {size:.2f} Tf "
            f"1 0 0 1 {x:.2f} {y:.2f} Tm <{encoded}> Tj ET\n"
        ).encode("ascii")

    def text(self, size, text, font, color=(0.11, 0.10, 0.08), gap=6):
        self.need(size + gap)
        self.draw(LEFT, self.y, size, text, font, color)
        self.y -= size + gap


def build_layout(levels, regular, bold):
    writer = Writer(regular, bold)
    title = "Epäsanat – epäsanalista opettajille"
    note = "Sanat ovat pseudosanoja lukiharjoitukseen, eivät testi tai diagnoosi."
    if bold.width(title, 18) > CONTENT_W:
        raise SystemExit("title does not fit on one line")
    if regular.width(note, 11) > CONTENT_W:
        raise SystemExit("note does not fit on one line")
    writer.text(18, title, bold, gap=10)
    writer.text(11, note, regular, color=(0.37, 0.34, 0.30), gap=16)
    row_h = 28
    col_w = CONTENT_W / 2
    accent = (0.055, 0.420, 0.329)
    for level in levels:
        writer.need(22 + row_h * 2)
        writer.draw(LEFT, writer.y, 14, level["name"], bold, accent)
        name_w = bold.width(level["name"], 14)
        blurb = level["blurb"]
        if name_w + 12 + regular.width(blurb, 11) <= CONTENT_W:
            writer.draw(LEFT + name_w + 12, writer.y, 11, blurb, regular, (0.37, 0.34, 0.30))
        else:
            writer.y -= 16
            writer.draw(LEFT, writer.y, 11, blurb, regular, (0.37, 0.34, 0.30))
        writer.y -= 18
        words = level["words"]
        for index in range(0, len(words), 2):
            writer.need(row_h)
            for column, item in enumerate(words[index : index + 2]):
                x = LEFT + column * col_w
                writer.draw(x, writer.y, 13, item["word"], bold)
                writer.draw(x, writer.y - 12, 10, item["syll"], regular, (0.37, 0.34, 0.30))
            writer.y -= row_h
        writer.y -= 12
    return writer.pages


def stream(data, extra=b"", compress=True):
    if compress:
        payload = zlib.compress(data)
        header = b"<< /Length " + str(len(payload)).encode() + b" /Filter /FlateDecode " + extra + b" >>"
    else:
        payload = data
        header = b"<< /Length " + str(len(payload)).encode() + b" " + extra + b">>"
    return header + b"\nstream\n" + payload + b"\nendstream"


def font_objects(font, type0, cid, desc, file_id, uni, widths_name):
    used = sorted(font.used)
    bf = []
    for gid in used:
        bf.append(f"<{gid:04X}> <{font.used[gid]:04X}>")
    groups = []
    index = 0
    while index < len(bf):
        chunk = bf[index : index + 100]
        groups.append(f"{len(chunk)} beginbfchar\n" + "\n".join(chunk) + "\nendbfchar\n")
        index += 100
    tounicode = (
        "/CIDInit /ProcSet findresource begin\n"
        "12 dict begin\n"
        "begincmap\n"
        "/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> def\n"
        "/CMapName /Adobe-Identity-UCS def\n"
        "/CMapType 2 def\n"
        "1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n"
        + "".join(groups)
        + "endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n"
    ).encode("ascii")
    w_parts = []
    for gid in used:
        w_parts.append(f"{gid} [{font.widths[gid]}]")
    x_min, y_min, x_max, y_max = font.bbox
    descriptor = (
        f"<< /Type /FontDescriptor /FontName /{font.ps} /Flags 32 "
        f"/FontBBox [{font.scaled(x_min)} {font.scaled(y_min)} {font.scaled(x_max)} {font.scaled(y_max)}] "
        f"/ItalicAngle 0 /Ascent {font.scaled(font.ascent)} /Descent {font.scaled(font.descent)} "
        f"/CapHeight {font.cap} /StemV 80 /FontFile2 {file_id} 0 R >>"
    ).encode("ascii")
    cid_obj = (
        f"<< /Type /Font /Subtype /CIDFontType2 /BaseFont /{font.ps} "
        f"/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> "
        f"/FontDescriptor {desc} 0 R /DW 500 /W [{' '.join(w_parts)}] /CIDToGIDMap /Identity >>"
    ).encode("ascii")
    type0_obj = (
        f"<< /Type /Font /Subtype /Type0 /BaseFont /{font.ps} /Encoding /Identity-H "
        f"/DescendantFonts [{cid} 0 R] /ToUnicode {uni} 0 R >>"
    ).encode("ascii")
    file_obj = stream(font.raw, extra=f"/Length1 {len(font.raw)} ".encode("ascii"), compress=True)
    uni_obj = stream(tounicode, compress=False)
    return {
        type0: type0_obj,
        cid: cid_obj,
        desc: descriptor,
        file_id: file_obj,
        uni: uni_obj,
    }


def write_pdf(pages, regular, bold):
    objects = {}
    n_pages = len(pages)
    next_id = 3
    page_ids = []
    content_ids = []
    for _ in range(n_pages):
        page_ids.append(next_id)
        content_ids.append(next_id + 1)
        next_id += 2
    regular_ids = {"type0": next_id, "cid": next_id + 1, "desc": next_id + 2, "file": next_id + 3, "uni": next_id + 4}
    next_id += 5
    bold_ids = {"type0": next_id, "cid": next_id + 1, "desc": next_id + 2, "file": next_id + 3, "uni": next_id + 4}
    next_id += 5
    info_id = next_id

    objects[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    kids = " ".join(f"{pid} 0 R" for pid in page_ids)
    objects[2] = f"<< /Type /Pages /Kids [{kids}] /Count {n_pages} >>".encode("ascii")
    resources = f"/Resources << /Font << /F1 {regular_ids['type0']} 0 R /F2 {bold_ids['type0']} 0 R >> >>"
    for pid, cid, content in zip(page_ids, content_ids, pages):
        objects[pid] = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W:.2f} {PAGE_H:.2f}] "
            f"/Contents {cid} 0 R {resources} >>"
        ).encode("ascii")
        objects[cid] = stream(bytes(content), compress=False)
    for font, ids in ((regular, regular_ids), (bold, bold_ids)):
        built = font_objects(font, ids["type0"], ids["cid"], ids["desc"], ids["file"], ids["uni"], font.ps)
        objects[ids["type0"]] = built[ids["type0"]]
        objects[ids["cid"]] = built[ids["cid"]]
        objects[ids["desc"]] = built[ids["desc"]]
        objects[ids["file"]] = built[ids["file"]]
        objects[ids["uni"]] = built[ids["uni"]]
    title = "Epäsanat – epäsanalista opettajille"
    objects[info_id] = (
        b"<< /Title "
        + pdf_utf16(title)
        + b" /Author "
        + pdf_utf16("Suvi Lindfors")
        + b" /Subject "
        + pdf_utf16("Pseudosanoja lukiharjoitukseen, eivät testi tai diagnoosi.")
        + b" >>"
    )

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = {}
    for number in range(1, info_id + 1):
        offsets[number] = len(out)
        out += f"{number} 0 obj\n".encode("ascii")
        out += objects[number]
        out += b"\nendobj\n"
    xref = len(out)
    size = info_id + 1
    out += f"xref\n0 {size}\n".encode("ascii")
    out += b"0000000000 65535 f \n"
    for number in range(1, info_id + 1):
        out += f"{offsets[number]:010d} 00000 n \n".encode("ascii")
    out += (
        f"trailer\n<< /Size {size} /Root 1 0 R /Info {info_id} 0 R >>\nstartxref\n{xref}\n%%EOF\n"
    ).encode("ascii")
    OUT.write_bytes(out)


def main():
    levels = load_levels()
    found = html_levels()
    if [level["name"] for level in levels] != [level["name"] for level in found]:
        raise SystemExit("HTML level names do not match sets.json")
    for expected, actual in zip(levels, found):
        if expected["words"] != actual["words"]:
            raise SystemExit(f"HTML words for {expected['name']} do not match the sampled set")
        print(f"{expected['name']}: {len(expected['words'])}")
    regular = Font(ARIAL, "Arial")
    bold = Font(ARIAL_BOLD, "Arial-Bold")
    for sample_char in "äöÄÖåÅ©·–":
        regular.glyph(sample_char)
        bold.glyph(sample_char)
    if regular.glyph("ä") == regular.glyph("a") or regular.glyph("ö") == regular.glyph("o"):
        raise SystemExit("cmap lookup collapsed Finnish letters onto base letters")
    pages = build_layout(levels, regular, bold)
    write_pdf(pages, regular, bold)
    data = OUT.read_bytes()
    if not data.startswith(b"%PDF"):
        raise SystemExit("PDF header missing")
    if b"<00E4>" not in data or b"<00F6>" not in data:
        raise SystemExit("ToUnicode map is missing ä or ö")
    if b"/FontName /Arial" not in data or b"/FontName /Arial-Bold" not in data:
        raise SystemExit("Arial font was not embedded")
    print(f"wrote {OUT} ({len(data)} bytes, {len(pages)} pages)")


if __name__ == "__main__":
    main()
