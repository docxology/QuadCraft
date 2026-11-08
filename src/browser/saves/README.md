# Browser snapshot formats and compatibility limits

`quadraygrid4/` and `quadraygrid5/` preserve historical JSON snapshots; filenames include timestamps and optional scenario descriptions. They are user/debugging data, not native saves or a server-managed save catalog.

Inspected grid4 samples contain `type`, `selq`, `camera`, `camPos/camQ`, `textBoxToEval`, `grid`, `ccp`, option/brush fields and sometimes `V`. Grid5 archives can contain `V`; current `../index.html` instead writes `root` for the current room through StateMap and checks `quadcraft_quadraygrid5_state` in LoadMap. Thus even matching filename prefixes do not prove current load compatibility. There is no universal `{dots,shapes,metadata}` schema or documented automatic migration.

Use the producing snapshot's serializer/loader as authority. Preserve original files before experimenting. LocalStorage quicksaves and downloaded files are separate from [JSP in-memory synchronization](../../server/README.md); none implies durable server backups. No load round trips were run in this audit.
