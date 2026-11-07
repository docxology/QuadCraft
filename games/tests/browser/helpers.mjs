export async function advance(page, ms = 96) { await page.clock.runFor(ms); }
export async function key(page, name) {
    await page.keyboard.press(name);
    await advance(page);
}
export async function state(page, fn, arg) { return page.evaluate(fn, arg); }
export async function click(page, point, options) {
    await page.mouse.click(point.x, point.y, options);
    await advance(page);
}

// Compare actual rendered pixels without depending on a platform-specific golden image.
export async function canvasPixels(page, selector = 'canvas') {
    return page.locator(selector).first().evaluate(canvas => canvas.toDataURL());
}
