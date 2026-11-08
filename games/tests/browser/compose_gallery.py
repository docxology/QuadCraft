"""Compose a selected gameplay portfolio from smoke.mjs --gallery captures.

Requires Python 3.11+ and Pillow 13.0+. No browser, game state or pixels are
simulated here: source PNGs are copied intact; labeled detail crops are scaled
with preserved aspect ratio for the overview.
"""

import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageFont, ImageOps


SELECTION = ["minecraft", "hex", "life", "tetris"]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def summary(name, observed):
    fields = {
        "minecraft": ["blocks", "removed", "selectedType"],
        "hex": ["moves"],
        "life": ["livingCells", "generation", "intervalMs"],
        "tetris": ["lockedCells", "score"],
    }[name]
    for field in fields:
        value = observed[field]
        require(type(value) is int and value >= 0, f"{name}: invalid {field}")
    if name == "minecraft":
        return f"{observed['blocks']} blocks | {observed['removed']} removed | type {observed['selectedType']} selected"
    if name == "hex":
        require(observed["currentPlayer"] in ["red", "blue"], "hex: invalid current player")
        return f"{observed['moves']} moves | next player {observed['currentPlayer']}"
    if name == "life":
        return f"{observed['livingCells']} living cells | generation {observed['generation']} | {observed['intervalMs']} ms interval"
    return f"{observed['lockedCells']} locked cells | score {observed['score']} | new active piece"


def load_capture(path):
    capture = json.loads(path.read_text())
    require(capture["schema"] == 1 and capture["mode"] == "selected-gallery",
            "Expected a selected-gallery capture manifest")
    require(capture["complete"] is True, "Capture did not complete successfully")
    require(capture["selection"] == SELECTION, "Unexpected gallery selection/order")
    require([result["name"] for result in capture["results"]] == SELECTION,
            "Missing, duplicate or out-of-order capture results")
    images = []
    for result in capture["results"]:
        name = result["name"]
        require(result["passed"] is True, f"{name}: scenario failed")
        view = result["gallery"]
        require(view["name"] == name, f"{name}: mismatched view")
        require(view["source"] == f"games/4d_{name}/index.html", f"{name}: invalid source")
        for field in ["category", "title", "action", "limit", "scenario"]:
            require(isinstance(view[field], str) and view[field].strip(), f"{name}: missing {field}")
        status = summary(name, view["observed"])
        # Inputs must be real files within the diagnostics directory, never placeholders.
        for field in ["initialScreenshot", "screenshot"]:
            source = path.parent / result[field]
            require(source.resolve().parent == path.parent.resolve(), f"{name}: invalid screenshot path")
            with Image.open(source) as image:
                require(image.format == "PNG", f"{name}: expected PNG")
                image.verify()
        source = path.parent / view["canvasScreenshot"]
        require(source.resolve().parent == path.parent.resolve(), f"{name}: invalid canvas path")
        with Image.open(source) as image:
            require(image.format == "PNG", f"{name}: expected canvas PNG")
            image.load()
            dimensions = view["dimensions"]
            require(image.width > 0 and image.height > 0, f"{name}: empty canvas")
            require(abs(image.width - dimensions["displayWidth"]) <= 1
                    and abs(image.height - dimensions["displayHeight"]) <= 1,
                    f"{name}: canvas capture dimensions disagree with browser")
            require(all(isinstance(dimensions[key], (int, float))
                        and math.isfinite(dimensions[key]) and dimensions[key] > 0
                        for key in ["width", "height", "displayWidth", "displayHeight"]),
                    f"{name}: invalid canvas dimensions")
            images.append((view, status, source, image.convert("RGB")))
    return capture, images


def compose(capture_path, output):
    capture, images = load_capture(capture_path)
    background, panel, ink, muted, accent = "#101722", "#1c2735", "#f1f5fa", "#b8c8db", "#73d7d2"
    figure = Image.new("RGB", (1920, 1870), background)
    draw = ImageDraw.Draw(figure)
    fonts = {size: ImageFont.load_default(size=size) for size in [23, 25, 27, 34, 50]}
    crops = {}

    def text(x, y, value, size, color=ink):
        draw.text((x, y), value, font=fonts[size], fill=color)

    def wrapped(x, y, value, width, size, color=ink):
        words, line = value.split(), ""
        for word in words:
            proposed = f"{line} {word}".strip()
            if line and draw.textlength(proposed, font=fonts[size]) > width:
                text(x, y, line, size, color)
                y += size + 8
                line = word
            else:
                line = proposed
        text(x, y, line, size, color)
        return y + size + 8

    text(40, 28, "QuadCraft | exercised browser gameplay", 50)
    text(42, 96, "Four real Chromium Canvas views; labeled center details, not the native renderer or a full-gate receipt.", 27, muted)
    for index, (view, status, source, image) in enumerate(images):
        x, y = 40 + (index % 2) * 936, 155 + (index // 2) * 800
        draw.rounded_rectangle((x, y, x + 904, y + 775), radius=16, fill=panel)
        category = f"{view['name']} | {view['category']}" + (
            " | center detail" if view["name"] != "minecraft" else " | full canvas")
        text(x + 24, y + 18, category.upper(), 23, accent)
        text(x + 24, y + 54, view["title"], 34)
        # Keep original PNGs intact. Center details make sparse projected pieces
        # readable without changing camera, board, contrast or gameplay pixels.
        bounds = (0, 0, image.width, image.height) if view["name"] == "minecraft" else (
            round(image.width * 0.32), round(image.height * 0.25),
            round(image.width * 0.68), round(image.height * 0.75))
        crops[view["name"]] = bounds
        scaled = ImageOps.contain(image.crop(bounds), (856, 505), Image.Resampling.LANCZOS)
        figure.paste(scaled, (x + 24 + (856 - scaled.width) // 2, y + 110 + (505 - scaled.height) // 2))
        text(x + 24, y + 626, status, 25, accent)
        end = wrapped(x + 24, y + 667, view["action"], 856, 25)
        end = wrapped(x + 24, end + 2, view["limit"], 856, 23, muted)
        require(end <= y + 775, f"{view['name']}: caption exceeds card")
    text(42, 1770, "Physical quadrays have rank three; raw four-index game slots may retain independent identity.", 27, muted)
    text(42, 1812, "Selected scenario evidence only. Sources, controls, capture recipe and SHA-256 provenance: docs/games.md.", 25, muted)

    # Validate all inputs and layout before publishing anything.
    output.mkdir(parents=True, exist_ok=True)
    provenance = {"schema": 1, "producer": "games/tests/browser/compose_gallery.py",
                  "captureCommand": "PYTHON=python3.13 node games/tests/browser/smoke.mjs --gallery",
                  "composition": "Original Canvas PNGs copied intact; labeled center crops, aspect-preserving scaling and letterboxing; no gameplay overlays or color changes",
                  "capture": capture, "published": []}
    for view, _, source, _ in images:
        target = output / f"{view['name']}-canvas.png"
        require(source.resolve() != target.resolve(), "Output must differ from capture input directory")
        shutil.copyfile(source, target)
        provenance["published"].append({"name": view["name"], "file": target.name,
                                        "sha256": digest(target), "overviewCropPixels": crops[view["name"]]})
    destination = output / "gallery.png"
    figure.save(destination)
    provenance["figure"] = {"file": destination.name, "sha256": digest(destination), "width": figure.width, "height": figure.height}
    (output / "provenance.json").write_text(json.dumps(provenance, indent=2) + "\n")
    print(f"Published {destination} ({figure.width} x {figure.height}); four original canvas PNGs and provenance.json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--capture", required=True, type=Path, help="External smoke.mjs --gallery capture.json")
    parser.add_argument("--output", required=True, type=Path, help="Dedicated published gallery directory")
    arguments = parser.parse_args()
    compose(arguments.capture.resolve(), arguments.output.resolve())
