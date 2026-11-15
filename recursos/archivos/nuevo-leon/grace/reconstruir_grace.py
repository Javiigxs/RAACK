#!/usr/bin/env python3
"""Reassemble the unmodified JPL GRACE source from verified byte parts (stdlib only)."""
import argparse
import hashlib
import os
from pathlib import Path
import tempfile

NAME = 'GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc'
SIZE = 46365171
SHA256 = '3522dd579cc10326339efdecece550ba01f41b9bee599d0ed915fc35f9eafb64'
MD5 = '1567b9401ec2a704aab16598fcce5e70'
PARTS = [('GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part001', 8388608, '716baf444595a001f40c0fbe7eeed896db5f0e8be937f30287584afe8dbc71fe'), ('GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part002', 8388608, 'a735bf3fd2aaa72e589d086b132cce10f9a3f6fa1296ce56cc9fa62a109d3bca'), ('GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part003', 8388608, '75d503bedd992f8aff2e10c227c1058cffc35d2dbee4806ea34fd2e1835416d3'), ('GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part004', 8388608, '0351adedbdd554c3c49a82a2d9b162033ce418f333b4a0efe1a6174d29970963'), ('GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part005', 8388608, 'f67c61f3369c103e3fb0cf8a4c98652c6266982285a8248960f4c6c2c280b0cb'), ('GRCTellus.JPL.200204_202609.GLO.RL06.3M.MSCNv04CRI.nc.part006', 4422131, '1ed1658eed7c3dd7fb23dc4fea94a6b1222d6397e9346c76d332eea199bb419f')]


def digest(path, algorithm='sha256'):
    h = hashlib.new(algorithm)
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', nargs='?', type=Path,
                        default=Path.home() / 'Downloads' / NAME,
                        help='Output netCDF path; defaults to ~/Downloads (outside this repository).')
    args = parser.parse_args()
    output = args.output.expanduser().resolve()
    if output.exists():
        if output.stat().st_size == SIZE and digest(output) == SHA256 and digest(output, 'md5') == MD5:
            print(f'Already verified: {output}')
            return
        raise SystemExit(f'Refusing to overwrite a different existing file: {output}')
    base = Path(__file__).resolve().parent
    for name, size, sha in PARTS:
        part = base / name
        if not part.is_file() or part.stat().st_size != size or digest(part) != sha:
            raise SystemExit(f'Missing or invalid part: {part}')
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(prefix=output.name + '.', suffix='.tmp',
                                         dir=output.parent, delete=False) as f:
            temporary = Path(f.name)
            for name, _, _ in PARTS:
                with (base / name).open('rb') as source:
                    for block in iter(lambda: source.read(1024 * 1024), b''):
                        f.write(block)
        if temporary.stat().st_size != SIZE or digest(temporary) != SHA256 or digest(temporary, 'md5') != MD5:
            raise SystemExit('Reconstructed file failed verification.')
        # Hard link creates the destination atomically and refuses overwrite, including races.
        os.link(temporary, output)
        print(f'Verified: {output}\nSHA-256 {SHA256}\nMD5 {MD5}')
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
